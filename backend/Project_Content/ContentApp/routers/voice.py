from typing import Annotated
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Path, Request, status
from starlette import status
from ..firebase_db import GeneratedContentDB, ActivityDB
from .auth import get_current_user
from starlette.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from ContentApp.services.btext import generate_text
from ..services.bvoice import text_to_speech

templates = Jinja2Templates(directory="ContentApp/templates")

router = APIRouter(
    prefix='/content/voices',
    tags=['voice generation']
)

class VoiceRequest(BaseModel):
    text: str
    voice: str = "en"


user_dependency = Annotated[dict, Depends(get_current_user)]

    
def redirect_to_login():
    redirect_response = RedirectResponse(url="/auth/login-page", status_code=status.HTTP_302_FOUND)
    redirect_response.delete_cookie(key="access_token")
    return redirect_response

@router.get("/", status_code=status.HTTP_200_OK)
async def fetch_all_audio(user: user_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    results = GeneratedContentDB.get_by_owner(user["id"], content_type="audio")
    return results


@router.get("/{audio_id}", status_code=status.HTTP_200_OK)
async def read_audio(user: user_dependency, audio_id: str):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    audio = GeneratedContentDB.get_by_id(audio_id)
    
    if not audio or audio.get('owner_id') != user["id"] or audio.get('type') != 'audio':
        raise HTTPException(status_code=404, detail="Audio not found")

    return audio


@router.delete("/{audio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_audio_clip(user: user_dependency, audio_id: str):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    audio = GeneratedContentDB.get_by_id(audio_id)
    if not audio or audio.get('owner_id') != user.get('id'):
        raise HTTPException(status_code=404, detail='Content not found.')
    
    success = GeneratedContentDB.delete(audio_id)
    if not success:
        raise HTTPException(status_code=404, detail="Audio clip not found or already deleted.")


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_audio_clip(request: VoiceRequest, user: user_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication failed.")

    data_url = text_to_speech(request.text, request.voice)

    if data_url == "Voice generation failed.":
        raise HTTPException(status_code=500, detail="Voice generation failed.")

    content_data = {
        'type': 'audio',
        'prompt': request.text,
        'file_url': data_url,
        'owner_id': user["id"]
    }
    
    new_audio = GeneratedContentDB.create(content_data)
    
    # Log activity
    try:
        ActivityDB.create({
            'user_id': user['id'],
            'type': 'content_generated',
            'action': 'Generated Audio',
            'description': f'AI generated audio: {request.text[:50]}...',
            'content_type': 'audio',
            'content_id': new_audio['id'],
            'metadata': {
                'prompt': request.text,
                'voice': request.voice,
                'file_url': data_url
            }
        })
    except Exception as e:
        pass

    return {"id": new_audio['id'], "file_url": data_url, "created_at": str(new_audio['created_at'])}





