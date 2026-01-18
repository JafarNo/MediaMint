"""
Text Generation Service using OpenAI GPT-4
"""
import uuid
from openai import OpenAIError
from ..firebase_db import ContentDB
from .openai_client import get_openai_client


def generateContent(prompt: str, user_id: str):
    """Generate text content and save to database"""
    try:
        client = get_openai_client()
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.7
        )

        GeneratedText = response.choices[0].message.content
        
        content_data = {
            'contentID': str(uuid.uuid4()),
            'title': f"Generated Text: {prompt[:20]}...",
            'type': "text",
            'mediaURL': GeneratedText,
            'isApproved': False,
            'status': "pending",
            'userID': user_id
        }
        newContent = ContentDB.create(content_data)
        return {"status": "success", "content": newContent}

    except Exception as e:
        return {"status": "error", "message": str(e)}


def approveContent(content_id: str):
    """Approve and publish text content"""
    content = ContentDB.get_by_id(content_id)
    if not content:
        return {"status": "error", "message": "Content not found"}
    
    ContentDB.update(content_id, {
        'isApproved': True,
        'status': "published"
    })
    return {"status": "success", "message": "Text content approved and published"}


def deleteContent(content_id: str):
    """Delete text content"""
    content = ContentDB.get_by_id(content_id)
    if not content:
        return {"status": "error", "message": "Content not found"}
    ContentDB.delete(content_id)
    return {"status": "success", "message": "Content deleted successfully"}


def generate_text(prompt: str):
    """Simple text generation function for router compatibility"""
    try:
        client = get_openai_client()
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.7
        )

        return response.choices[0].message.content
        
    except OpenAIError as e:
        raise Exception(f"OpenAI API Error: {str(e)}")
    except Exception as e:
        raise Exception(f"Text generation failed: {str(e)}")