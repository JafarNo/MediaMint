import base64
import uuid
from typing import Annotated, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .auth import get_current_user
from ..services.bimage import generate_image
from ..services.openai_client import get_openai_client
from ..services.aws_clients import get_s3, S3_BUCKET
from ..config import AWS_REGION
from ..firebase_db import GeneratedContentDB, ActivityDB

router = APIRouter(
    prefix='/content/images',
    tags=['image generation']
)

user_dependency = Annotated[dict, Depends(get_current_user)]
security = HTTPBearer(auto_error=False)

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Get current user from token if provided, otherwise return None"""
    if credentials is None:
        return None
    try:
        from .auth import get_current_user, oauth2_bearer
        # Extract token from credentials
        token = credentials.credentials
        # Manually call get_current_user with the token
        from jose import jwt, JWTError
        from .auth import SECRET_KEY, ALGORITHM
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get('id')
        username: str = payload.get('sub')
        user_role: str = payload.get('role')
        if username is None or user_id is None:
            return None
        return {'username': username, 'id': user_id, 'user_role': user_role}
    except:
        return None

user_dependency_optional = Annotated[Optional[dict], Depends(get_current_user_optional)]


class RequestImage(BaseModel):
    prompt: str = Field(min_length=3)
    content_type: str = Field(default='post', description="Content type: 'post' (1:1), 'story' (9:16), or 'reel' (9:16)")
    style: Optional[str] = Field(default=None, description="Style: professional, creative, minimal, vibrant, cinematic, natural")



@router.get("/", status_code=status.HTTP_200_OK)
async def fetch_all_images(user: user_dependency):
    """Fetch all image content for the current user"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    results = GeneratedContentDB.get_by_owner(user["id"], content_type="image")
    return results


@router.get("/{image_id}", status_code=status.HTTP_200_OK)
async def read_image(user: user_dependency, image_id: str):
    """Get a specific image by ID"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    image = GeneratedContentDB.get_by_id(image_id)
    
    if not image or image.get('owner_id') != user["id"] or image.get('type') != 'image':
        raise HTTPException(status_code=404, detail="Image not found")

    return image


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(user: user_dependency, image_id: str):
    """Delete an image"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    image = GeneratedContentDB.get_by_id(image_id)
    
    if not image or image.get('owner_id') != user["id"]:
        raise HTTPException(status_code=404, detail='Content not found.')
    
    success = GeneratedContentDB.delete(image_id)
    if not success:
        raise HTTPException(status_code=404, detail="Image not found or already deleted.")


def generate_social_caption(prompt: str, content_type: str = 'post') -> str:
    """Generate a social media caption for the image using GPT."""
    try:
        client = get_openai_client()
        
        system_prompt = """You are a social media expert. Generate an engaging Instagram caption for a post.
The caption should:
- Be engaging and attention-grabbing
- Include relevant emojis
- Include 3-5 relevant hashtags at the end
- Be optimized for Instagram engagement
- Be between 100-200 characters (excluding hashtags)
- Match the tone appropriate for the content type"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate an Instagram caption for an image about: {prompt}"}
            ],
            max_tokens=200,
            temperature=0.8
        )
        
        caption = response.choices[0].message.content.strip()
        return caption
        
    except Exception as e:
        return ""


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_image(request: RequestImage, user: user_dependency_optional = None):
    """Generate an Instagram-optimized image using AI"""
    try:
        data_url = generate_image(
            prompt=request.prompt,
            content_type=request.content_type,
            style=request.style
        )
    except Exception as e:
        error_msg = str(e)
        
        # Check if it's a rate limiting error
        if "rate_limit" in error_msg.lower() or "Rate limit" in error_msg:
            raise HTTPException(
                status_code=429,  # Too Many Requests
                detail="OpenAI rate limit exceeded. Please wait a moment before trying again."
            )
        else:
            raise HTTPException(status_code=500, detail=error_msg)

    # Generate social media caption for the image
    caption = generate_social_caption(request.prompt, request.content_type)

    # Upload base64 image to S3 instead of storing in Firestore
    try:
        # Extract base64 data from data URL (format: data:image/png;base64,<data>)
        base64_data = data_url.split(',')[1] if ',' in data_url else data_url
        image_bytes = base64.b64decode(base64_data)
        
        # Generate unique key for S3
        content_id = str(uuid.uuid4())
        image_key = f"images/generated/{content_id}.png"
        
        # Upload to S3
        s3 = get_s3()
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=image_key,
            Body=image_bytes,
            ContentType="image/png"
        )
        
        # Generate pre-signed URL (valid for 7 days)
        file_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET, 'Key': image_key},
            ExpiresIn=604800  # 7 days in seconds
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

    # Save to Firebase with S3 URL and caption
    content_data = {
        'type': 'image',
        'prompt': request.prompt,
        'file_url': file_url,
        'caption': caption,
        'owner_id': user['id'] if user else None
    }
    
    new_image = GeneratedContentDB.create(content_data)
    
    # Log activity
    if user:
        try:
            ActivityDB.create({
                'user_id': user['id'],
                'type': 'content_generated',
                'action': 'Generated Image',
                'description': f'AI generated image: {request.prompt[:50]}...',
                'content_type': 'image',
                'content_id': new_image['id'],
                'metadata': {
                    'prompt': request.prompt,
                    'file_url': file_url,
                    'caption': caption
                }
            })
        except Exception as e:
            pass

    return {
        "id": new_image['id'],
        "file_url": file_url,
        "caption": caption,
        "created_at": str(new_image['created_at'])
    }





