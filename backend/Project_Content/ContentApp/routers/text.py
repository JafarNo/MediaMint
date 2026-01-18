from typing import Annotated, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Path, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .auth import get_current_user
from ContentApp.services.btext import generate_text
from ..firebase_db import GeneratedContentDB, ActivityDB

router = APIRouter(
    prefix='/content/text',
    tags=['text generation']
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


class RequestText(BaseModel):
    prompt: str = Field(min_length=3)



@router.get("/", status_code=status.HTTP_200_OK)
async def fetch_all_texts(user: user_dependency):
    """Fetch all text content for the current user"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    results = GeneratedContentDB.get_by_owner(user["id"], content_type="text")
    return results


@router.get("/{text_id}", status_code=status.HTTP_200_OK)
async def read_text(user: user_dependency, text_id: str):
    """Get a specific text content by ID"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    text = GeneratedContentDB.get_by_id(text_id)
    
    if not text or text.get('owner_id') != user["id"] or text.get('type') != 'text':
        raise HTTPException(status_code=404, detail="Text not found")

    return text


@router.delete("/{text_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_text(user: user_dependency, text_id: str):
    """Delete a text content"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    text = GeneratedContentDB.get_by_id(text_id)
    
    if not text or text.get('owner_id') != user["id"]:
        raise HTTPException(status_code=404, detail='Content not found.')
    
    success = GeneratedContentDB.delete(text_id)
    if not success:
        raise HTTPException(status_code=404, detail="Text not found or already deleted.")


@router.post("/", status_code=status.HTTP_201_CREATED)
async def generate_text_route(request: RequestText, user: user_dependency_optional = None):
    """Generate text content using AI"""
    
    try:
        result = generate_text(request.prompt)
    except Exception as e:
        error_msg = str(e)
        
        # Check for specific error types
        if "rate_limit" in error_msg.lower() or "Rate limit" in error_msg:
            raise HTTPException(
                status_code=429,
                detail=error_msg
            )
        elif "OpenAI API Error" in error_msg:
            raise HTTPException(
                status_code=500,
                detail=error_msg
            )
        else:
            raise HTTPException(status_code=500, detail=error_msg)

    # Save to Firebase
    content_data = {
        'type': 'text',
        'prompt': request.prompt,
        'result_text': result,
        'owner_id': user['id'] if user else None
    }
    
    new_record = GeneratedContentDB.create(content_data)
    
    # Log activity
    if user:
        try:
            ActivityDB.create({
                'user_id': user['id'],
                'type': 'content_generated',
                'action': 'Generated Story',
                'description': f'AI generated story: {request.prompt[:50]}...',
                'content_type': 'text',
                'content_id': new_record['id'],
                'metadata': {
                    'prompt': request.prompt,
                    'result_text': result[:100] + '...' if len(result) > 100 else result
                }
            })
        except Exception as e:
            pass

    return {
        "id": new_record['id'],
        "prompt": new_record['prompt'],
        "result_text": new_record['result_text'],
        "created_at": str(new_record['created_at'])
    }



