from typing import Annotated, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .auth import get_current_user
from ..services.bvideo import generate_video
from ..firebase_db import GeneratedContentDB, ActivityDB
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Thread pool for running sync video generation in background
_executor = ThreadPoolExecutor(max_workers=2)

router = APIRouter(
    prefix='/content/videos',
    tags=['videos generation']
)

user_dependency = Annotated[dict, Depends(get_current_user)]
security = HTTPBearer(auto_error=False)

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Get current user from token if provided, otherwise return None"""
    if credentials is None:
        return None
    try:
        from jose import jwt
        from .auth import SECRET_KEY, ALGORITHM
        token = credentials.credentials
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


class RequestVideo(BaseModel):
    prompt: str = Field(min_length=3)
    content_type: str = Field(default='reel', description="Content type: 'reel', 'story', or 'post'")
    style: Optional[str] = Field(default=None, description="Style: professional, creative, minimal, vibrant, cinematic, natural")



@router.get("/", status_code=status.HTTP_200_OK)
async def fetch_all_videos(user: user_dependency):
    """Fetch all video content for the current user"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    results = GeneratedContentDB.get_by_owner(user["id"], content_type="video")
    return results


@router.get("/{video_id}", status_code=status.HTTP_200_OK)
async def read_video(user: user_dependency, video_id: str):
    """Get a specific video by ID"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    video = GeneratedContentDB.get_by_id(video_id)
    
    if not video or video.get('owner_id') != user["id"] or video.get('type') != 'video':
        raise HTTPException(status_code=404, detail="Video not found")

    return video


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(user: user_dependency, video_id: str):
    """Delete a video"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    video = GeneratedContentDB.get_by_id(video_id)
    
    if not video or video.get('owner_id') != user["id"]:
        raise HTTPException(status_code=404, detail='Content not found.')
    
    success = GeneratedContentDB.delete(video_id)
    if not success:
        raise HTTPException(status_code=404, detail="Video not found or already deleted.")


def _generate_video_background(video_id: str, prompt: str, content_type: str, style: str, user_id: str = None):
    """Background task to generate video and update the record"""
    try:
        data_url = generate_video(
            prompt=prompt,
            content_type=content_type,
            style=style
        )
        
        # Update the video record with the generated URL
        GeneratedContentDB.update(video_id, {
            'file_url': data_url,
            'status': 'completed'
        })
        
        # Log activity
        if user_id:
            try:
                ActivityDB.create({
                    'user_id': user_id,
                    'type': 'content_generated',
                    'action': 'Generated Video',
                    'description': f'AI generated video: {prompt[:50]}...',
                    'content_type': 'video',
                    'content_id': video_id,
                    'metadata': {
                        'prompt': prompt,
                        'file_url': data_url
                    }
                })
            except:
                pass
                
    except Exception as e:
        # Update status to failed
        GeneratedContentDB.update(video_id, {
            'status': 'failed',
            'error': str(e)
        })


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
async def create_video(request: RequestVideo, background_tasks: BackgroundTasks, user: user_dependency_optional = None):
    """Generate an Instagram-optimized video using AI (async - returns immediately)"""
    
    # Create a pending video record
    content_data = {
        'type': 'video',
        'prompt': request.prompt,
        'file_url': None,
        'status': 'processing',
        'owner_id': user['id'] if user else None
    }
    
    new_video = GeneratedContentDB.create(content_data)
    
    # Start video generation in background
    background_tasks.add_task(
        _generate_video_background,
        new_video['id'],
        request.prompt,
        request.content_type,
        request.style,
        user['id'] if user else None
    )

    return {
        "id": new_video['id'],
        "status": "processing",
        "message": "Video generation started. Poll /content/videos/{id} to check status.",
        "created_at": str(new_video['created_at'])
    }


@router.get("/status/{video_id}", status_code=status.HTTP_200_OK)
async def get_video_status(video_id: str, user: user_dependency_optional = None):
    """Check the status of a video generation job"""
    video = GeneratedContentDB.get_by_id(video_id)
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Check ownership if user is authenticated
    if user and video.get('owner_id') and video.get('owner_id') != user['id']:
        raise HTTPException(status_code=404, detail="Video not found")
    
    return {
        "id": video_id,
        "status": video.get('status', 'unknown'),
        "file_url": video.get('file_url'),
        "error": video.get('error')
    }





