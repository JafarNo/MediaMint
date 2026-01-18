"""
Video Generation Service using OpenAI Sora
Generates high-quality AI videos from text prompts.
"""
import time
import uuid
import requests
from openai import OpenAIError
from ..firebase_db import ContentDB
from .openai_client import get_openai_client
from .aws_clients import get_s3, S3_BUCKET
from ..config import AWS_REGION

s3 = get_s3()
outputBucket = S3_BUCKET
outputPrefix = "videos"

# Sora video resolutions
SORA_RESOLUTIONS = {
    'post': '1280x720',       # Landscape for feed posts
    'story': '720x1280',      # Vertical for stories
    'reel': '720x1280',       # Vertical for reels
}

# Pre-prompting templates for Instagram video optimization
INSTAGRAM_VIDEO_PRE_PROMPTS = {
    'reel': "Cinematic, high-quality, engaging short video, smooth motion, vibrant colors, professional production, social media optimized, trending aesthetic, ",
    'story': "Dynamic, eye-catching, fast-paced, vibrant, mobile-friendly, Instagram story style, engaging visual content, ",
    'post': "High-quality video, professional look, engaging content, smooth transitions, ",
}

VIDEO_STYLE_ENHANCEMENTS = {
    'professional': "corporate style, clean visuals, polished production, business-appropriate",
    'creative': "artistic shots, unique angles, creative transitions, visually striking",
    'minimal': "clean aesthetic, simple composition, elegant, understated",
    'vibrant': "bold colors, high energy, dynamic movement, eye-catching",
    'cinematic': "film-like quality, dramatic lighting, cinematic composition, moody atmosphere",
    'natural': "organic movement, natural lighting, authentic feel, warm tones",
}


def generateContent(prompt: str, user_id: str, content_type: str = 'reel', style: str = None):
    """
    Generate video content using OpenAI Sora.
    
    Args:
        prompt: User's description of the video
        user_id: User identifier
        content_type: 'reel', 'story', or 'post'
        style: Optional style enhancement
    """
    try:
        client = get_openai_client()
        
        # Build enhanced prompt with pre-prompting
        pre_prompt = INSTAGRAM_VIDEO_PRE_PROMPTS.get(content_type, INSTAGRAM_VIDEO_PRE_PROMPTS['reel'])
        style_enhancement = VIDEO_STYLE_ENHANCEMENTS.get(style.lower(), "") if style else ""
        
        enhanced_prompt = f"{pre_prompt}{prompt}"
        if style_enhancement:
            enhanced_prompt = f"{enhanced_prompt}, {style_enhancement}"
        
        enhanced_prompt = enhanced_prompt[:4000]
        resolution = SORA_RESOLUTIONS.get(content_type, SORA_RESOLUTIONS['reel'])
        

        # Create video generation job with Sora
        response = client.videos.create(
            model="sora-2",
            prompt=enhanced_prompt,
            size=resolution,
            seconds="8"  # 8 seconds for social media (allowed: '4', '8', '12')
        )
        
        job_id = response.id

        # Poll for completion (max 5 minutes)
        video_url = _poll_video_job(client, job_id, timeout=300)
        
        if not video_url:
            return {"status": "error", "message": "Video generation timed out"}

        # Download video and upload to S3
        content_id = str(uuid.uuid4())
        video_key = f"{outputPrefix}/pending/{content_id}.mp4"
        
        import os
        if os.path.isfile(video_url):     
            with open(video_url, 'rb') as f:
                video_bytes = f.read()
            os.remove(video_url)
        else:
            video_response = requests.get(video_url, stream=True)
            video_response.raise_for_status()
            video_bytes = video_response.content
        
        s3.put_object(Bucket=outputBucket, Key=video_key, Body=video_bytes, ContentType="video/mp4")
        
        final_url = f"https://{outputBucket}.s3.{AWS_REGION}.amazonaws.com/{video_key}"
        
        content_data = {
            'contentID': content_id,
            'title': f"Video: {prompt[:20]}",
            'type': "video",
            'mediaURL': final_url,
            'isApproved': False,
            'status': "pending",
            'userID': user_id
        }
        newContent = ContentDB.create(content_data)
        return {"status": "success", "content": newContent}

    except OpenAIError as e:
        return {"status": "error", "message": f"OpenAI API Error: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def _poll_video_job(client, job_id: str, timeout: int = 300, poll_interval: int = 5):
    """Poll Sora video job until completion or timeout."""
    start_time = time.time()
    
    while (time.time() - start_time) < timeout:
        try:
            job = client.videos.retrieve(job_id)
            
            if job.status == "completed":
                
                # OpenAI Sora API requires downloading the video content separately
                # Use client.videos.download_content() method
                try:
                    import tempfile
                    import os
                    
                    # Download video content using the correct API method
                    content = client.videos.download_content(job_id, variant="video")
                    
                    # Save to temp file using write_to_file method
                    temp_path = os.path.join(tempfile.gettempdir(), f"sora_{job_id}.mp4")
                    content.write_to_file(temp_path)
                    
                    return temp_path  # Return local file path
                    
                except Exception as content_error:
                    raise
                    
            elif job.status == "failed":
                return None
            else:
                elapsed = int(time.time() - start_time)
                time.sleep(poll_interval)
                
        except Exception as e:
            raise
    
    return None
    
def approveContent(content_id: str):
    content = ContentDB.get_by_id(content_id)

    if not content:
        return{"status":"error", "message":"Content not found"}
    
    ContentDB.update(content_id, {
        'isApproved': True,
        'status': "published"
    })

    return{"status":"success","message":"Video published successfully "}

def deleteContent(content_id: str):
    content = ContentDB.get_by_id(content_id)
    if not content:
        return{"status":"error", "message":"Content not found"}
    try:
        s3.delete_object(
            Bucket=outputBucket,
            Key=content.get('mediaURL', '')
        )
        ContentDB.delete(content_id)

        return{"status":"success","message":"Content deleted successfully"}
    except Exception as e:
        return{"status":"error", "message":str(e)} 

def generate_video(prompt: str, content_type: str = 'reel', style: str = None):
    """
    Generate video using OpenAI Sora and return the video URL.
    
    Args:
        prompt: User's description of the video
        content_type: 'reel', 'story', or 'post'
        style: Optional style enhancement key
    
    Returns:
        str: URL to the generated video
    """
    try:
        client = get_openai_client()
        
        # Build enhanced prompt with pre-prompting
        pre_prompt = INSTAGRAM_VIDEO_PRE_PROMPTS.get(content_type, INSTAGRAM_VIDEO_PRE_PROMPTS['reel'])
        style_enhancement = VIDEO_STYLE_ENHANCEMENTS.get(style.lower(), "") if style else ""
        
        enhanced_prompt = f"{pre_prompt}{prompt}"
        if style_enhancement:
            enhanced_prompt = f"{enhanced_prompt}, {style_enhancement}"
        
        enhanced_prompt = enhanced_prompt[:4000]
        resolution = SORA_RESOLUTIONS.get(content_type, SORA_RESOLUTIONS['reel'])
        

        # Create video generation job with Sora
        response = client.videos.create(
            model="sora-2",
            prompt=enhanced_prompt,
            size=resolution,
            seconds="8" 
        )
        
        job_id = response.id

      
        video_url = _poll_video_job(client, job_id, timeout=300)
        
        if not video_url:
            raise Exception("Video generation timed out or failed")

      
        content_id = str(uuid.uuid4())
        video_key = f"{outputPrefix}/generated/{content_id}.mp4"
        
        import os
        if os.path.isfile(video_url):
            # It's a local file path - read directly
            
            with open(video_url, 'rb') as f:
                video_bytes = f.read()
            # Clean up temp file
            os.remove(video_url)
        else:
            video_response = requests.get(video_url, stream=True)
            video_response.raise_for_status()
            video_bytes = video_response.content
        
        s3.put_object(Bucket=outputBucket, Key=video_key, Body=video_bytes, ContentType="video/mp4")
        
        # Generate pre-signed URL (valid for 7 days)
        final_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': outputBucket, 'Key': video_key},
            ExpiresIn=604800  # 7 days in seconds
        )
        
        return final_url

    except OpenAIError as e:
        raise Exception(f"Video generation failed: {str(e)}")
    except Exception as e:
        raise Exception(f"Video generation failed: {str(e)}")

