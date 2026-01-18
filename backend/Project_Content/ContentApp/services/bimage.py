"""
Image Generation Service using OpenAI DALL-E 3
"""
import base64
import time
import uuid
import httpx
from openai import OpenAIError
from ..firebase_db import ContentDB
from .openai_client import get_openai_client
from .aws_clients import get_s3, S3_BUCKET
from ..config import AWS_REGION

# Retry configuration for rate limiting
MAX_RETRIES = 3
INITIAL_BACKOFF = 2  # seconds

s3 = get_s3()
bucketName = S3_BUCKET

# DALL-E 3 supported sizes
DALLE_SIZES = {
    'post': '1024x1024',      # 1:1 square for feed posts
    'story': '1024x1792',     # Vertical for stories/reels
    'reel': '1024x1792',      # Vertical for reels
}

# Pre-prompting templates for better Instagram content
INSTAGRAM_PRE_PROMPTS = {
    'post': "High-quality professional photograph, vibrant colors, sharp focus, Instagram-worthy, engaging composition, ",
    'story': "Vertical format, eye-catching, vibrant, mobile-optimized, Instagram story style, engaging visual, ",
    'reel': "Vertical format, dynamic, eye-catching, vibrant colors, social media optimized, trending aesthetic, ",
}

STYLE_ENHANCEMENTS = {
    'professional': "professional lighting, clean background, corporate style, polished look",
    'creative': "artistic, unique perspective, creative composition, visually striking",
    'minimal': "minimalist, clean, simple, elegant, white space",
    'vibrant': "bold colors, high contrast, energetic, eye-catching",
    'cinematic': "cinematic lighting, dramatic, film-like quality, moody atmosphere",
    'natural': "natural lighting, organic, authentic, warm tones",
}

def generateContent(prompt: str, user_id: str, content_type: str = 'post', style: str = None):
    """
    Generate Instagram-optimized image content using DALL-E 3.
    
    Args:
        prompt: User's description of the image
        user_id: User identifier
        content_type: 'post' (1:1), 'story' (9:16), or 'reel' (9:16)
        style: Optional style enhancement
    """
    try:
        client = get_openai_client()
        
        # Get size based on content type
        size = DALLE_SIZES.get(content_type, DALLE_SIZES['post'])
        
        # Build enhanced prompt with pre-prompting
        pre_prompt = INSTAGRAM_PRE_PROMPTS.get(content_type, INSTAGRAM_PRE_PROMPTS['post'])
        style_enhancement = STYLE_ENHANCEMENTS.get(style, "") if style else ""
        
        enhanced_prompt = f"{pre_prompt}{prompt}"
        if style_enhancement:
            enhanced_prompt = f"{enhanced_prompt}, {style_enhancement}"
        
        # DALL-E 3 has a 4000 character limit
        enhanced_prompt = enhanced_prompt[:4000]
        
        
        response = client.images.generate(
            model="dall-e-3",
            prompt=enhanced_prompt,
            size=size,
            quality="hd",
            n=1,
            response_format="b64_json"
        )

        image_bytes = base64.b64decode(response.data[0].b64_json)

        content_id = str(uuid.uuid4())
        image_key = f"pending/{content_id}.png"

        s3.put_object(Bucket=bucketName, Key=image_key, Body=image_bytes, ContentType="image/png")
        
        content_data = {
            'contentID': content_id,
            'title': f"Image: {prompt[:20]}",
            'type': "image",
            'mediaURL': f"https://{bucketName}.s3.{AWS_REGION}.amazonaws.com/{image_key}",
            'isApproved': False,
            'status': "pending",
            'userID': user_id,
        }
        newContent = ContentDB.create(content_data)
        return {"status": "success", "content": newContent}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    
  
def approveContent(content_id: str):
   content = ContentDB.get_by_id(content_id)
   if not content:
    return{"status":"error", "message":"Content not found"}
   
   old_key=f"pending/{content_id}.png"
   new_key=f"published/{content_id}.png"
   try:

    s3.copy_object(
    Bucket=bucketName,
    CopySource={'Bucket':bucketName,'Key':old_key},
    Key=new_key,
    )
     
    s3.delete_object(Bucket=bucketName, Key=old_key)
    
    ContentDB.update(content_id, {
        'mediaURL': f"https://{bucketName}.s3.{AWS_REGION}.amazonaws.com/{new_key}",
        'isApproved': True,
        'status': "published"
    })

    return {"status":"success","message":"Content published successfully"}
   except Exception as e:
      return{"status":"error", "message":str(e)}
   
def deleteContent(content_id: str):
   content = ContentDB.get_by_id(content_id)
   if not content:
    return{"status":"error", "message":"Content not found"}
   path_key= content.get('mediaURL', '').split(".com/")[-1]
   s3.delete_object(Bucket=bucketName, Key=path_key) 
   ContentDB.delete(content_id)
   return{"status":"success", "message":"Content deleted"}

def generate_image(prompt: str, content_type: str = 'post', style: str = None):
    """
    Instagram-optimized image generation function using DALL-E 3.
    
    Args:
        prompt: User's description of the image
        content_type: 'post' (1:1), 'story' (9:16), or 'reel' (9:16)
        style: Optional style enhancement key
    """
    # Get size based on content type
    size = DALLE_SIZES.get(content_type, DALLE_SIZES['post'])
    
    # Build enhanced prompt with pre-prompting
    pre_prompt = INSTAGRAM_PRE_PROMPTS.get(content_type, INSTAGRAM_PRE_PROMPTS['post'])
    style_enhancement = ""
    if style and style.lower() in STYLE_ENHANCEMENTS:
        style_enhancement = STYLE_ENHANCEMENTS[style.lower()]
    
    enhanced_prompt = f"{pre_prompt}{prompt}"
    if style_enhancement:
        enhanced_prompt = f"{enhanced_prompt}, {style_enhancement}"
    
    # DALL-E 3 has a 4000 character limit
    enhanced_prompt = enhanced_prompt[:4000]


    # Retry logic with exponential backoff for rate limiting
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            if attempt > 0:
                wait_time = INITIAL_BACKOFF * (2 ** (attempt - 1))
                time.sleep(wait_time)
            
            client = get_openai_client()
            response = client.images.generate(
                model="dall-e-3",
                prompt=enhanced_prompt,
                size=size,
                quality="hd",
                n=1,
                response_format="b64_json"
            )

            image_base64 = response.data[0].b64_json
            return f"data:image/png;base64,{image_base64}"

        except OpenAIError as e:
            error_msg = str(e)
            
            # Retry on rate limit errors
            if "rate_limit" in error_msg.lower():
                last_error = e
                continue
            else:
                raise Exception(f"Image generation failed: {error_msg}")
                
        except Exception as e:
            raise Exception(f"Image generation failed: {str(e)}")
    
    # All retries exhausted
    raise Exception("Image generation failed: Rate limit exceeded. Please wait a moment and try again.")




    
 
