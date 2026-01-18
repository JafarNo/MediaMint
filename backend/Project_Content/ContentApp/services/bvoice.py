import uuid
from ..firebase_db import ContentDB
from botocore.exceptions import ClientError
from .aws_clients import get_s3, get_polly, S3_BUCKET
from ..config import AWS_REGION

polly = get_polly()
s3 = get_s3()
BucketName = S3_BUCKET

def generateContent(user_id: str, text: str, lang: str = 'en'):
    try:
        voice_map = {
            "en": "Joanna",
            "en-male": "Matthew",
            "ar": "Hala",
            "ar-male": "Zayd"
        }

        voice_id = voice_map.get(lang, "Joanna") 
       
        response = polly.synthesize_speech(
            Text=text,
            OutputFormat="mp3",
            VoiceId=voice_id
        )
        audio_bytes = response["AudioStream"].read()
        content_id=str(uuid.uuid4())
        audio_key=f"pending/voice_{content_id}.mp3"

        s3.put_object(
            Bucket=BucketName,
            Key=audio_key,
            Body=audio_bytes,
            ContentType="audio/mpeg"
        )
        
        content_data = {
            'contentID': content_id,
            'title': f"Voice:{text[:20]}...",
            'type': "voice",
            'mediaURL': f"https://{BucketName}.s3.{AWS_REGION}.amazonaws.com/{audio_key}",
            'isApproved': False,
            'status': "pending",
            'userID': user_id
        }
        newContent = ContentDB.create(content_data)
        return{"status":"success","content":newContent}
    
    except Exception as e:
        return {"status":"error","message":f"Music merge failed:{str(e)}"}
    
def approveContent(content_id: str):
    content = ContentDB.get_by_id(content_id)

    if not content:
        return{"status":"error", "message":"Content not found"}
    
    old_key=f"pending/voice_{content_id}.mp3"
    new_key=f"published/voice_{content_id}.mp3"

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

def text_to_speech(text: str, lang: str = 'en'):
    """Simple text-to-speech function for router compatibility"""
    import base64
    try:
        voice_map = {
            "en": "Joanna",
            "en-male": "Matthew",
            "ar": "Hala",
            "ar-male": "Zayd"
        }

        voice_id = voice_map.get(lang, "Joanna")

        response = polly.synthesize_speech(
            Text=text,
            OutputFormat="mp3",
            VoiceId=voice_id
        )
        audio_bytes = response["AudioStream"].read()
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        return f"data:audio/mpeg;base64,{audio_base64}"

    except Exception as e:
        return "Voice generation failed."
