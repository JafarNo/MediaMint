from fastapi import APIRouter, HTTPException, Depends, Path, Request, status
from ..services.music_overlay import add_music_to_video
from typing import Annotated

from starlette import status

from .auth import get_current_user
from starlette.responses import RedirectResponse
from fastapi.templating import Jinja2Templates


router = APIRouter(prefix="/music", tags=["music overlay"])

user_dependency = Annotated[dict, Depends(get_current_user)]

def redirect_to_login():
    redirect_response = RedirectResponse(url="/auth/login-page", status_code=status.HTTP_302_FOUND)
    redirect_response.delete_cookie(key="access_token")
    return redirect_response


@router.post("/add-music")
async def add_music(user: user_dependency,video_key: str, music_key: str):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    """
    Adds background music to a video from S3 and returns the new file URL.
    Example keys:
      - video_key: "videos/generated_video.mp4"
      - music_key: "music/background.mp3"
    """
    file_url = add_music_to_video(video_key, music_key)

    if file_url == "Video music merge failed.":
        raise HTTPException(status_code=500, detail="Failed to add music to video.")

    return {"message": "Music added successfully", "file_url": file_url}
