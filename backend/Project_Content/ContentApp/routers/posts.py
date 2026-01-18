"""
Posts Router for MediaMint
Handles creating, scheduling, and managing posts with S3 media upload
"""

from typing import Annotated, Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from .auth import get_current_user
from ..firebase_db import ContentDB, ActivityDB, GeneratedContentDB
from ..firebase_config import db, COLLECTIONS, generate_id
from ..services.s3_upload import upload_file_to_s3, upload_base64_to_s3, generate_presigned_upload_url, delete_file_from_s3

router = APIRouter(
    prefix='/posts',
    tags=['posts']
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

class CreatePostRequest(BaseModel):
    """Request model for creating a post"""
    media_type: str  # 'image', 'video', 'story'
    content_source: str  # 'upload', 'ai'
    platforms: List[str]  # ['instagram', 'facebook', etc.]
    caption: Optional[str] = ""
    media_url: Optional[str] = None  # For AI-generated content or already uploaded
    media_base64: Optional[str] = None  # For direct base64 upload
    media_content_type: Optional[str] = None  # MIME type for base64
    prompt: Optional[str] = None  # AI generation prompt
    style: Optional[str] = None  # AI generation style
    status: str = "published"  # 'published', 'scheduled', 'draft'
    scheduled_at: Optional[str] = None  # ISO datetime string for scheduled posts


class SchedulePostRequest(BaseModel):
    """Request model for scheduling a post"""
    post_id: str
    scheduled_at: str  # ISO datetime string


class UpdatePostRequest(BaseModel):
    """Request model for updating a post"""
    caption: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[str] = None


class PresignedUrlRequest(BaseModel):
    """Request model for getting a presigned upload URL"""
    filename: str
    content_type: str
    folder: Optional[str] = "posts"

class PostDB:
    """Database operations for posts"""
    collection = 'posts'
    
    @staticmethod
    def create(data: dict) -> dict:
        """Create a new post"""
        post_id = generate_id()
        post_data = {
            'id': post_id,
            'user_id': data.get('user_id'),
            'media_type': data.get('media_type'),
            'content_source': data.get('content_source'),
            'platforms': data.get('platforms', []),
            'caption': data.get('caption', ''),
            'media_url': data.get('media_url'),
            'prompt': data.get('prompt'),
            'style': data.get('style'),
            'status': data.get('status', 'published'),
            'scheduled_at': data.get('scheduled_at'),
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc)
        }
        db.collection(PostDB.collection).document(post_id).set(post_data)
        return post_data
    
    @staticmethod
    def get_by_id(post_id: str) -> Optional[dict]:
        """Get post by ID"""
        doc = db.collection(PostDB.collection).document(post_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
    @staticmethod
    def get_by_user(user_id: str, status: Optional[str] = None, limit: int = 50) -> List[dict]:
        """Get all posts for a user"""
        from google.cloud.firestore_v1 import FieldFilter
        
        try:
            query = db.collection(PostDB.collection).where(
                filter=FieldFilter('user_id', '==', user_id)
            )
            
            if status:
                query = query.where(filter=FieldFilter('status', '==', status))
            
            # Try with ordering first (requires composite index)
            try:
                docs = query.order_by('created_at', direction='DESCENDING').limit(limit).get()
            except Exception as e:
                # Fallback: query without ordering
                docs = query.limit(limit).get()
            
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            return []
    
    @staticmethod
    def update(post_id: str, data: dict) -> bool:
        """Update a post"""
        try:
            data['updated_at'] = datetime.now(timezone.utc)
            db.collection(PostDB.collection).document(post_id).update(data)
            return True
        except Exception:
            return False
    
    @staticmethod
    def delete(post_id: str) -> bool:
        """Delete a post"""
        try:
            db.collection(PostDB.collection).document(post_id).delete()
            return True
        except Exception:
            return False



@router.get("/", status_code=status.HTTP_200_OK)
async def get_posts(
    user: user_dependency,
    post_status: Optional[str] = None,
    limit: int = 50
):
    """Get all posts for the current user"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    try:
        posts = PostDB.get_by_user(user["id"], status=post_status, limit=limit)
        return posts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch posts: {str(e)}")


@router.get("/{post_id}", status_code=status.HTTP_200_OK)
async def get_post(user: user_dependency, post_id: str):
    """Get a specific post by ID"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    post = PostDB.get_by_id(post_id)
    
    if not post or post.get('user_id') != user["id"]:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return post


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_post(request: CreatePostRequest, user: user_dependency):
    """
    Create a new post with media upload to S3
    
    - For uploaded content: provide media_base64 and media_content_type
    - For AI-generated content: provide media_url (already generated)
    """
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    media_url = request.media_url

    # Validation: precise check for connected accounts before doing anything else
    if request.status in ['published', 'scheduled'] and request.platforms:
        from .social import SocialAccountDB
        user_accounts = SocialAccountDB.get_by_user(user['id'])
        
        for platform in request.platforms:
            account = next((a for a in user_accounts if a.get('platform') == platform), None)
            if not account:
                raise HTTPException(
                    status_code=400, 
                    detail=f"You must connect your {platform.capitalize()} account before posting."
                )
    
    # Handle base64 media upload to S3
    if request.media_base64 and request.media_content_type:
        try:
            folder = f"posts/{request.media_type}s"
            media_url = upload_base64_to_s3(
                request.media_base64,
                request.media_content_type,
                folder
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload media: {str(e)}")
    
    if not media_url and request.media_type != 'story':
        raise HTTPException(status_code=400, detail="Media URL is required for image/video posts")
    
    # Parse scheduled_at if provided
    scheduled_at = None
    if request.scheduled_at:
        try:
            scheduled_at = datetime.fromisoformat(request.scheduled_at.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid scheduled_at format. Use ISO format.")
    
    # Create the post
    post_data = {
        'user_id': user['id'],
        'media_type': request.media_type,
        'content_source': request.content_source,
        'platforms': request.platforms,
        'caption': request.caption or '',
        'media_url': media_url,
        'prompt': request.prompt,
        'style': request.style,
        'status': request.status,
        'scheduled_at': scheduled_at
    }
    
    new_post = PostDB.create(post_data)
    
    # If status is 'published', immediately publish to social platforms
    social_post_ids = {}
    if request.status == 'published' and request.platforms:
        from .social import SocialAccountDB
        from ..services.meta_service import MetaService
        

        for platform in request.platforms:
            try:
                # Get user's connected account for this platform
                accounts = SocialAccountDB.get_by_user(user['id'])
                account = next((a for a in accounts if a.get('platform') == platform), None)
                
                if not account:
                    continue
                
                access_token = account.get('page_access_token') or account.get('accessToken')
                if not access_token:
                    continue
                
                meta_service = MetaService(access_token)
                platform_post_id = None
                
                try:
                    if platform == 'facebook':
                        page_id = account.get('pageID')
                        page_token = account.get('page_access_token')
                        
                        if page_id:
                            fb_media_type = 'video' if request.media_type == 'video' else 'photo'
                            result = await meta_service.post_to_facebook_page(
                                page_id, page_token, request.caption or '',
                                media_url=media_url, media_type=fb_media_type
                            )
                            platform_post_id = result.get('id') or result.get('post_id')
                            
                    elif platform == 'instagram':
                        instagram_id = account.get('instagram_account_id')
                        page_token = account.get('page_access_token')
                        
                        if instagram_id:
                            ig_media_type = 'VIDEO' if request.media_type == 'video' else 'IMAGE'
                            result = await meta_service.post_to_instagram(
                                instagram_id, page_token, media_url, request.caption or '', ig_media_type
                            )
                            platform_post_id = result.get('id')
                    
                    if platform_post_id:
                        social_post_ids[platform] = platform_post_id
                        
                finally:
                    await meta_service.close()
                    
            except Exception as e:
                pass
        
        # Update post with social_post_ids
        if social_post_ids:
            PostDB.update(new_post['id'], {
                'social_post_ids': social_post_ids,
                'published_at': datetime.now(timezone.utc)
            })
            new_post['social_post_ids'] = social_post_ids
    
    # Create activity record
    try:
        platform_names = ', '.join(request.platforms) if request.platforms else 'Unknown'
        
        if request.status == 'scheduled':
            activity_type = 'post_scheduled'
            activity_action = 'Scheduled Post'
            activity_description = f'Scheduled {request.media_type} post for {platform_names}'
        elif request.status == 'draft':
            activity_type = 'post_draft'
            activity_action = 'Saved Draft'
            activity_description = f'Saved {request.media_type} draft for {platform_names}'
        else:
            activity_type = 'post_created'
            activity_action = 'Created Post'
            activity_description = f'Published {request.media_type} to {platform_names}'
        
        ActivityDB.create({
            'user_id': user['id'],
            'type': activity_type,
            'action': activity_action,
            'description': activity_description,
            'platform': request.platforms[0] if request.platforms else None,
            'content_type': request.media_type,
            'content_id': new_post['id'],
            'metadata': {
                'platforms': request.platforms,
                'caption': request.caption[:100] if request.caption else '',
                'media_url': media_url,
                'scheduled_at': str(scheduled_at) if scheduled_at else None,
                'content_source': request.content_source
            }
        })
    except Exception as e:
        pass
    
    return {
        "id": new_post['id'],
        "media_url": media_url,
        "status": new_post['status'],
        "platforms": new_post['platforms'],
        "created_at": str(new_post['created_at']),
        "message": f"Post {'scheduled' if request.status == 'scheduled' else 'created'} successfully!"
    }


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_media(
    user: user_dependency,
    file: UploadFile = File(...),
    media_type: str = Form(...)
):
    """
    Upload media file directly to S3
    Returns the S3 URL for use in post creation
    """
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    # Validate file type
    allowed_image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    allowed_video_types = ['video/mp4', 'video/webm', 'video/quicktime']
    
    if media_type == 'image' and file.content_type not in allowed_image_types:
        raise HTTPException(status_code=400, detail=f"Invalid image type: {file.content_type}")
    
    if media_type == 'video' and file.content_type not in allowed_video_types:
        raise HTTPException(status_code=400, detail=f"Invalid video type: {file.content_type}")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload to S3
        folder = f"posts/{media_type}s"
        media_url = upload_file_to_s3(
            file_content,
            file.filename,
            file.content_type,
            folder
        )
        
        return {
            "media_url": media_url,
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(file_content)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload media: {str(e)}")


@router.post("/presigned-url", status_code=status.HTTP_200_OK)
async def get_presigned_url(request: PresignedUrlRequest, user: user_dependency):
    """
    Get a presigned URL for direct client-side upload to S3
    This allows the mobile app to upload directly to S3 without going through the server
    """
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    try:
        result = generate_presigned_upload_url(
            request.filename,
            request.content_type,
            request.folder or "posts"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate presigned URL: {str(e)}")


@router.put("/{post_id}", status_code=status.HTTP_200_OK)
async def update_post(user: user_dependency, post_id: str, request: UpdatePostRequest):
    """Update a post"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    post = PostDB.get_by_id(post_id)
    
    if not post or post.get('user_id') != user["id"]:
        raise HTTPException(status_code=404, detail="Post not found")
    
    update_data = {}
    if request.caption is not None:
        update_data['caption'] = request.caption
    if request.status is not None:
        update_data['status'] = request.status
    if request.scheduled_at is not None:
        try:
            update_data['scheduled_at'] = datetime.fromisoformat(request.scheduled_at.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid scheduled_at format")
    
    if update_data:
        success = PostDB.update(post_id, update_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update post")
    
    updated_post = PostDB.get_by_id(post_id)
    return updated_post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(user: user_dependency, post_id: str):
    """Delete a post and its media from S3"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    post = PostDB.get_by_id(post_id)
    
    if not post or post.get('user_id') != user["id"]:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Try to delete media from S3
    if post.get('media_url') and 's3.' in post.get('media_url', ''):
        try:
            delete_file_from_s3(post['media_url'])
        except Exception as e:
            pass
    
    # Delete from social platforms if configured
    social_ids = post.get('social_post_ids', {})
    if social_ids:
        try:
            from .social import SocialAccountDB
            from ..services.meta_service import MetaService, MetaAPIError
            
            # Get user accounts to find access tokens
            accounts = SocialAccountDB.get_by_user(user['id'])
            
            for platform, social_post_id in social_ids.items():
                # Find matching account
                account = next((a for a in accounts if a.get('platform') == platform), None)
                if not account:
                    continue
                    
                access_token = account.get('page_access_token') or account.get('accessToken')
                if not access_token:
                    continue
                
                try:
                    meta_service = MetaService(access_token)
                    await meta_service.delete_post(social_post_id, access_token)
                    await meta_service.close()
                except Exception as e:
                    pass
                    
        except Exception as e:
            pass

    # Delete autoresponder settings if they exist
    try:
        from .social import AutoresponderSettingsDB
        AutoresponderSettingsDB.delete(post_id)
    except Exception as e:
        pass

    # Delete the post
    success = PostDB.delete(post_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete post")


@router.get("/scheduled/upcoming", status_code=status.HTTP_200_OK)
async def get_scheduled_posts(user: user_dependency):
    """Get all scheduled posts for the current user"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    posts = PostDB.get_by_user(user["id"], status="scheduled")
    return posts


@router.get("/drafts/all", status_code=status.HTTP_200_OK)
async def get_draft_posts(user: user_dependency):
    """Get all draft posts for the current user"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    posts = PostDB.get_by_user(user["id"], status="draft")
    return posts


@router.get("/stats/overview", status_code=status.HTTP_200_OK)
async def get_posts_stats(user: user_dependency):
    """Get posts statistics for the current user"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    try:
        from datetime import date
        
        # Get all posts for the user
        all_posts = PostDB.get_by_user(user["id"], limit=1000)
        
        # Calculate stats
        total_posts = len(all_posts)
        published_count = sum(1 for p in all_posts if p.get('status') == 'published')
        scheduled_count = sum(1 for p in all_posts if p.get('status') == 'scheduled')
        draft_count = sum(1 for p in all_posts if p.get('status') == 'draft')
        
        # Get today's date
        today = date.today()
        
        # Count posts scheduled for today
        scheduled_today = 0
        for post in all_posts:
            if post.get('status') == 'scheduled' and post.get('scheduled_at'):
                try:
                    scheduled_at = post['scheduled_at']
                    # Handle both string and datetime objects
                    if isinstance(scheduled_at, str):
                        scheduled_date = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00')).date()
                    else:
                        scheduled_date = scheduled_at.date()
                    
                    if scheduled_date == today:
                        scheduled_today += 1
                except Exception as e:
                    continue
        
        return {
            "total_posts": total_posts,
            "published": published_count,
            "scheduled": scheduled_count,
            "drafts": draft_count,
            "scheduled_today": scheduled_today
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get posts stats: {str(e)}")


@router.post("/scheduler/trigger", status_code=status.HTTP_200_OK)
async def trigger_scheduler(user: user_dependency):
    """
    Manually trigger the scheduler to check and publish due posts.
    Useful for testing or forcing immediate processing.
    """
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    # Only allow admin users to trigger scheduler manually
    if user.get('user_role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    try:
        from ..services.post_scheduler import get_scheduler
        
        scheduler = get_scheduler()
        await scheduler._check_and_publish_due_posts()
        
        return {
            "message": "Scheduler triggered successfully",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger scheduler: {str(e)}")


@router.get("/scheduler/status", status_code=status.HTTP_200_OK)
async def get_scheduler_status(user: user_dependency):
    """Get the current status of the post scheduler"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    try:
        from ..services.post_scheduler import get_scheduler
        
        scheduler = get_scheduler()
        
        return {
            "running": scheduler._running,
            "check_interval_seconds": scheduler._check_interval,
            "message": "Scheduler is running" if scheduler._running else "Scheduler is stopped"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scheduler status: {str(e)}")


@router.get("/calendar/{year}/{month}", status_code=status.HTTP_200_OK)
async def get_calendar_posts(year: int, month: int, user: user_dependency):
    """Get all posts organized by day for a specific month (all statuses)"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    try:
        from calendar import monthrange

        # Get ALL posts for the user (no status filter) to show on calendar
        all_posts = PostDB.get_by_user(user["id"], limit=1000)

        # Get the number of days in the month
        _, days_in_month = monthrange(year, month)

        # Initialize calendar with empty lists for each day (use string keys for JSON)
        calendar_data = {str(day): [] for day in range(1, days_in_month + 1)}

        # Organize posts by day - use scheduled_at or created_at
        for post in all_posts:
            # Use scheduled_at if available, otherwise use created_at
            post_datetime = post.get('scheduled_at') or post.get('created_at')
            if not post_datetime:
                continue

            try:
                # Handle various datetime formats
                if isinstance(post_datetime, str):
                    post_date = datetime.fromisoformat(post_datetime.replace('Z', '+00:00'))
                elif hasattr(post_datetime, 'timestamp'):
                    # Handle Firestore Timestamp objects
                    post_date = datetime.fromtimestamp(post_datetime.timestamp(), tz=timezone.utc)
                else:
                    post_date = post_datetime

                # Check if post is in the requested month/year
                if post_date.year == year and post_date.month == month:
                    day = str(post_date.day)
                    calendar_data[day].append({
                        "id": post.get('id'),
                        "caption": post.get('caption') or post.get('prompt') or 'No caption',
                        "media_url": post.get('media_url'),
                        "media_base64": post.get('media_base64'),
                        "media_type": post.get('media_type', 'image'),
                        "platforms": post.get('platforms', []),
                        "status": post.get('status', 'draft'),
                        "scheduled_at": post_datetime if isinstance(post_datetime, str) else post_date.isoformat(),
                        "scheduled_time": post_date.strftime("%H:%M")
                    })
            except Exception as e:
                continue

        # Sort posts within each day by time
        for day in calendar_data:
            calendar_data[day].sort(key=lambda x: x.get('scheduled_time', ''))

        return {
            "year": year,
            "month": month,
            "days_in_month": days_in_month,
            "calendar": calendar_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get calendar posts: {str(e)}")


@router.get("/debug/social-posts", status_code=status.HTTP_200_OK)
async def get_posts_with_social_ids(user: user_dependency):
    """Debug endpoint: Get all posts that have social_post_ids"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    try:
        posts = PostDB.get_by_user(user["id"], limit=100)
        
        # Filter posts with social_post_ids
        posts_with_social_ids = []
        posts_without_social_ids = []
        
        for post in posts:
            social_ids = post.get('social_post_ids')
            post_info = {
                'id': post.get('id'),
                'caption': (post.get('caption') or '')[:50],
                'status': post.get('status'),
                'platforms': post.get('platforms'),
                'social_post_ids': social_ids,
                'created_at': str(post.get('created_at'))
            }
            
            if social_ids and len(social_ids) > 0:
                posts_with_social_ids.append(post_info)
            else:
                posts_without_social_ids.append(post_info)
        
        return {
            'total_posts': len(posts),
            'posts_with_social_ids': len(posts_with_social_ids),
            'posts_without_social_ids': len(posts_without_social_ids),
            'with_social_ids': posts_with_social_ids,
            'without_social_ids': posts_without_social_ids[:10]  # Limit to 10
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
