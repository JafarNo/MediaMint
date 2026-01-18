from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from .auth import get_current_user
from ..firebase_db import ActivityDB

router = APIRouter(
    prefix='/activities',
    tags=['activities']
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


class CreateActivityRequest(BaseModel):
    type: str  # 'post_created', 'post_scheduled', 'response_generated'
    action: str  # 'Created Post', 'Scheduled Post', 'Generated Response'
    description: str
    platform: Optional[str] = None
    content_type: Optional[str] = None
    content_id: Optional[str] = None
    metadata: Optional[dict] = {}



@router.get("/", status_code=status.HTTP_200_OK)
async def get_recent_activities(user: user_dependency, limit: int = 50):
    """Get recent activities for the current user"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    try:
        activities = ActivityDB.get_by_user(user["id"], limit=limit)
        
        # Serialize datetime objects to ISO strings for JSON response
        serialized = []
        for activity in activities:
            try:
                item = dict(activity)
                if item.get('created_at'):
                    item['created_at'] = item['created_at'].isoformat() if hasattr(item['created_at'], 'isoformat') else str(item['created_at'])
                serialized.append(item)
            except Exception as e:
                continue
        
        return serialized
    except Exception as e:
        import traceback
        traceback.print_exc()
        return []  # Return empty array instead of 500 error


@router.get("/recent", status_code=status.HTTP_200_OK)
async def get_activities_last_days(user: user_dependency, days: int = 7):
    """Get activities from the last N days"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    activities = ActivityDB.get_recent(user["id"], days=days)
    return activities


@router.get("/{activity_id}", status_code=status.HTTP_200_OK)
async def get_activity(user: user_dependency, activity_id: str):
    """Get a specific activity by ID"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    activity = ActivityDB.get_by_id(activity_id)
    
    if not activity or activity.get('user_id') != user["id"]:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    return activity


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_activity(request: CreateActivityRequest, user: user_dependency_optional = None):
    """Create a new activity record"""
    activity_data = {
        'user_id': user['id'] if user else None,
        'type': request.type,
        'action': request.action,
        'description': request.description,
        'platform': request.platform,
        'content_type': request.content_type,
        'content_id': request.content_id,
        'metadata': request.metadata or {}
    }
    
    new_activity = ActivityDB.create(activity_data)
    return new_activity


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(user: user_dependency, activity_id: str):
    """Delete an activity"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    activity = ActivityDB.get_by_id(activity_id)
    
    if not activity or activity.get('user_id') != user["id"]:
        raise HTTPException(status_code=404, detail='Activity not found.')
    
    success = ActivityDB.delete(activity_id)
    if not success:
        raise HTTPException(status_code=404, detail="Activity not found or already deleted.")
