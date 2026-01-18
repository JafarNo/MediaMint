import tempfile
import json
import time
import uuid
import srt
import requests
from datetime import timedelta
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip
from ..firebase_db import ContentDB
import os
from .aws_clients import get_s3, get_transcribe, S3_BUCKET
from ..config import AWS_REGION

s3 = get_s3()
transcribe = get_transcribe()
BucketName = S3_BUCKET


def generateContent(video_key: str, user_id: str):
   
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_video_path = os.path.join(temp_dir,"input.mp4")
            temp_audio_path = os.path.join(temp_dir,"input.mp3")
            temp_output_path = os.path.join(temp_dir,"output_captioned.mp4")

            s3.download_file(BucketName,video_key, temp_video_path)
            video= VideoFileClip(temp_video_path)
            video.audio.write_audiofile(temp_audio_path,codec="mp3")

            audio_key= f"temp_audio/{uuid.uuid4().hex}.mp3"
            s3.upload_file(temp_audio_path, BucketName,audio_key)

            job_name = f"transcription_{uuid.uuid4().hex}"
            transcribe.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={"MediaFileUri": f"s3://{BucketName}/{audio_key}"},
                MediaFormat="mp3",
                LanguageCode="en-US",
                OutputBucketName=BucketName,
            )

            while True:
                status = transcribe.get_transcription_job(TranscriptionJobName=job_name)
                job_status = status["TranscriptionJob"]["TranscriptionJobStatus"]
                if job_status in ["COMPLETED", "FAILED"]:
                    break
                time.sleep(5)
            if job_status == "FAILED":
                raise Exception("Transcription failed.")

            transcript_uri = status["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
            transcript_data = requests.get(transcript_uri).json()
            items = transcript_data["results"]["items"]

            subtitles = []
            for i, item in enumerate(items):
                if "start_time" in item:
                    start = float(item["start_time"])
                    end = float(item.get("end_time", start + 1))
                    text = item["alternatives"][0]["content"]
                    subtitles.append(srt.Subtitle(index=i, start=timedelta(seconds=start),
                    end=timedelta(seconds=end), content=text))

            txt_clips = []
            for sub in subtitles:
                txt_clip = TextClip(sub.content, fontsize=30, color='white', bg_color='black',
                font='Arial-Bold', method='caption', size=(video.w, None))

                txt_clip = txt_clip.set_start(sub.start.total_seconds()).set_end(sub.end.total_seconds()).set_position(("center", "bottom"))
                txt_clips.append(txt_clip)

            final_video = CompositeVideoClip([video] + txt_clips)
            final_video.write_videofile(temp_output_path, codec="libx264", audio_codec="aac",verbose=False, logger=None)

            content_id= str(uuid.uuid4())
            output_key = f"pending/captions_{content_id}.mp4"
            s3.upload_file(temp_output_path, BucketName, output_key, ExtraArgs={"ContentType": "video/mp4"})

            content_data = {
                'contentID': content_id,
                'title': "Auto-Captioned Video",
                'type': "captions",
                'mediaURL': f"https://{BucketName}.s3.{AWS_REGION}.amazonaws.com/{output_key}",
                'isApproved': False,
                'status': "pending",
                'userID': user_id
            }
            
            newContent = ContentDB.create(content_data)

            s3.delete_object(Bucket=BucketName,Key=audio_key)

            return{"status":"success","content":newContent}
        
    except Exception as e:
        return{"status":"error","message":f"Generation failed: {str(e)}"}
       
def approveContent(content_id: str):
    content = ContentDB.get_by_id(content_id)

    if not content:
        return{"status":"error", "message":"Content not found"}
    
    old_key=f"pending/captions_{content_id}.mp4"
    new_key=f"published/captions_{content_id}.mp4"
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
    return {"status":"success","message":"Content deleted"}

def generate_auto_captions(video_key: str):
    """Simple auto-caption function for router compatibility"""
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_video_path = os.path.join(temp_dir, "input.mp4")
            temp_audio_path = os.path.join(temp_dir, "input.mp3")
            temp_output_path = os.path.join(temp_dir, "output_captioned.mp4")

            s3.download_file(BucketName, video_key, temp_video_path)
            video = VideoFileClip(temp_video_path)
            video.audio.write_audiofile(temp_audio_path, codec="mp3")

            audio_key = f"temp_audio/{uuid.uuid4().hex}.mp3"
            s3.upload_file(temp_audio_path, BucketName, audio_key)

            job_name = f"transcription_{uuid.uuid4().hex}"
            transcribe.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={"MediaFileUri": f"s3://{BucketName}/{audio_key}"},
                MediaFormat="mp3",
                LanguageCode="en-US",
                OutputBucketName=BucketName,
            )

            while True:
                status = transcribe.get_transcription_job(TranscriptionJobName=job_name)
                job_status = status["TranscriptionJob"]["TranscriptionJobStatus"]
                if job_status in ["COMPLETED", "FAILED"]:
                    break
                time.sleep(5)
            if job_status == "FAILED":
                return "Caption generation failed."

            transcript_uri = status["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
            transcript_data = requests.get(transcript_uri).json()
            items = transcript_data["results"]["items"]

            subtitles = []
            for i, item in enumerate(items):
                if "start_time" in item:
                    start = float(item["start_time"])
                    end = float(item.get("end_time", start + 1))
                    text = item["alternatives"][0]["content"]
                    subtitles.append(srt.Subtitle(index=i, start=timedelta(seconds=start),
                    end=timedelta(seconds=end), content=text))

            txt_clips = []
            for sub in subtitles:
                txt_clip = TextClip(sub.content, fontsize=30, color='white', bg_color='black',
                font='Arial-Bold', method='caption', size=(video.w, None))
                txt_clip = txt_clip.set_start(sub.start.total_seconds()).set_end(sub.end.total_seconds()).set_position(("center", "bottom"))
                txt_clips.append(txt_clip)

            final_video = CompositeVideoClip([video] + txt_clips)
            final_video.write_videofile(temp_output_path, codec="libx264", audio_codec="aac", verbose=False, logger=None)

            content_id = str(uuid.uuid4())
            output_key = f"pending/captions_{content_id}.mp4"
            s3.upload_file(temp_output_path, BucketName, output_key, ExtraArgs={"ContentType": "video/mp4"})

            s3.delete_object(Bucket=BucketName, Key=audio_key)

            return f"https://{BucketName}.s3.{AWS_REGION}.amazonaws.com/{output_key}"

    except Exception as e:
        return "Caption generation failed."

