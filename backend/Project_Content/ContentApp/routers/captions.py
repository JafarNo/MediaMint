from fastapi import APIRouter, HTTPException, Depends, Path, Request, status
from ..services.bcaptions import generate_auto_captions
from typing import Annotated

from starlette import status

from .auth import get_current_user
from starlette.responses import RedirectResponse
from fastapi.templating import Jinja2Templates


router = APIRouter(prefix="/captions", tags=["captions overlay"])

user_dependency = Annotated[dict, Depends(get_current_user)]

def redirect_to_login():
    redirect_response = RedirectResponse(url="/auth/login-page", status_code=status.HTTP_302_FOUND)
    redirect_response.delete_cookie(key="access_token")
    return redirect_response


@router.post("/add-captions")
async def add_captions(video_key: str):
    ##if user is None:
      ##  raise HTTPException(status_code=401, detail='Authentication Failed')
    """
    Adds background music to a video from S3 and returns the new file URL.
    Example keys:
      - video_key: "videos/generated_video.mp4"
      - music_key: "music/background.mp3"
    """
    file_url = generate_auto_captions(video_key)
    if file_url == "Caption generation failed.":
        raise HTTPException(status_code=500, detail="Failed to generate captions.")
    return {"message": "Captions generated successfully", "file_url": file_url}