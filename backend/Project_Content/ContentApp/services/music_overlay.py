import tempfile
import uuid
import os
from moviepy.editor import VideoFileClip, AudioFileClip, CompositeAudioClip
from botocore.exceptions import ClientError
from moviepy.audio.fx.all import audio_loop
from ..firebase_db import ContentDB
from .aws_clients import get_s3, S3_BUCKET
from ..config import AWS_REGION

s3 = get_s3()
BucketName = S3_BUCKET


def generateContent(user_id: str, video_s3_key: str, music_s3_key: str):
    try:
        temp_dir=tempfile.gettempdir()
        temp_video_path =os.path.join(temp_dir,f"vid_{uuid.uuid4().hex}.mp4")
        temp_music_path =os.path.join(temp_dir,f"mus_{uuid.uuid4().hex}.mp3")
        temp_output_path= os.path.join(temp_dir,f"out_{uuid.uuid4().hex}.mp4")
      
        s3.download_file(BucketName,video_s3_key,temp_video_path)
        s3.download_file(BucketName,music_s3_key,temp_music_path)

      
        video = VideoFileClip(temp_video_path)
        background_audio = AudioFileClip(temp_music_path).volumex(0.3)
        if background_audio.duration > video.duration:
           background_audio = background_audio.subclip(0, video.duration)
        else:
         background_audio = audio_loop(background_audio, duration=video.duration)

        if video.audio is not None:
            final_audio = CompositeAudioClip([video.audio, background_audio])
        else:
            final_audio = background_audio

        final_video = video.set_audio(final_audio)

        final_video.write_videofile(
            temp_output_path,
            codec="libx264",
            audio_codec="aac",
            verbose=False,
            logger=None
        )
        content_id=str(uuid.uuid4())
        output_key = f"pending/music_{content_id}.mp4"

        s3.upload_file(
            temp_output_path,
            BucketName,
            output_key,
            ExtraArgs={"ContentType": "video/mp4"}
        )

        content_data = {
            'contentID': content_id,
            'title': "Video with Music Overlay",
            'type': "music_video",
            'mediaURL': f"https://{BucketName}.s3.{AWS_REGION}.amazonaws.com/{output_key}",
            'isApproved': False,
            'status': "pending",
            'userID': user_id
        }
        
        newContent = ContentDB.create(content_data)
        for p in [temp_video_path,temp_music_path, temp_output_path]:
            if os.path.exists(p):
                os.remove(p)
        return{"status":"success","content":newContent}
    
    except Exception as e:
        return {"status":"error","message":f"Music merge failed:{str(e)}"}
    
def approveContent(content_id: str):
    content = ContentDB.get_by_id(content_id)

    if not content:
        return{"status":"error", "message":"Content not found"}
    
    old_key=f"pending/music_{content_id}.mp4"
    new_key=f"published/music_{content_id}.mp4"
    s3.copy_object(Bucket=BucketName,CopySource={'Bucket':BucketName,'Key':old_key},
                   Key=new_key)
    s3.delete_object(Bucket=BucketName, Key=old_key)

    ContentDB.update(content_id, {
        'mediaURL': f"https://{BucketName}.s3.{AWS_REGION}.amazonaws.com/{new_key}",
        'isApproved': True,
        'status': "published"
    })
    return{"status":"success","url":f"https://{BucketName}.s3.{AWS_REGION}.amazonaws.com/{new_key}"}

def deleteContent(content_id: str):
    content = ContentDB.get_by_id(content_id)
    if not content:
        return{"status":"error", "message":"Content not found"}
    path_key=content.get('mediaURL', '').split(".com/")[-1]
    s3.delete_object(Bucket=BucketName,Key=path_key)
    ContentDB.delete(content_id)
    return {"status":"success", "message":"Content deleted"}

def add_music_to_video(video_s3_key: str, music_s3_key: str):
    """Simple music overlay function for router compatibility"""
    try:
        temp_dir = tempfile.gettempdir()
        temp_video_path = os.path.join(temp_dir, f"vid_{uuid.uuid4().hex}.mp4")
        temp_music_path = os.path.join(temp_dir, f"mus_{uuid.uuid4().hex}.mp3")
        temp_output_path = os.path.join(temp_dir, f"out_{uuid.uuid4().hex}.mp4")

        s3.download_file(BucketName, video_s3_key, temp_video_path)
        s3.download_file(BucketName, music_s3_key, temp_music_path)

        video = VideoFileClip(temp_video_path)
        background_audio = AudioFileClip(temp_music_path).volumex(0.3)
        if background_audio.duration > video.duration:
            background_audio = background_audio.subclip(0, video.duration)
        else:
            background_audio = audio_loop(background_audio, duration=video.duration)

        if video.audio is not None:
            final_audio = CompositeAudioClip([video.audio, background_audio])
        else:
            final_audio = background_audio

        final_video = video.set_audio(final_audio)
        final_video.write_videofile(
            temp_output_path,
            codec="libx264",
            audio_codec="aac",
            verbose=False,
            logger=None
        )

        content_id = str(uuid.uuid4())
        output_key = f"pending/music_{content_id}.mp4"

        s3.upload_file(
            temp_output_path,
            BucketName,
            output_key,
            ExtraArgs={"ContentType": "video/mp4"}
        )

        for p in [temp_video_path, temp_music_path, temp_output_path]:
            if os.path.exists(p):
                os.remove(p)

        return f"https://{BucketName}.s3.{AWS_REGION}.amazonaws.com/{output_key}"

    except Exception as e:
        return "Video music merge failed."
