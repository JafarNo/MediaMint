from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from ..firebase_db import db

router = APIRouter(prefix="/contact", tags=["contact"])

class ContactSubmission(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=2000)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_contact_form(submission: ContactSubmission):
    """Submit a contact form message"""
    try:
        # Create contact submission document
        contact_data = {
            "name": submission.name,
            "email": submission.email,
            "subject": submission.subject,
            "message": submission.message,
            "created_at": datetime.utcnow().isoformat(),
            "status": "pending",  # pending, read, responded
        }
        
        # Save to Firebase
        contact_ref = db.collection('contact_submissions').document()
        contact_ref.set(contact_data)
        
        
        return {
            "status": "success",
            "message": "Your message has been received. We'll get back to you within 24 hours.",
            "submission_id": contact_ref.id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit contact form: {str(e)}"
        )

@router.get("/")
async def get_contact_submissions(status_filter: str = None, limit: int = 50):
    """Get all contact form submissions (admin endpoint)"""
    try:
        query = db.collection('contact_submissions')
        
        if status_filter:
            query = query.where('status', '==', status_filter)
        
        query = query.order_by('created_at', direction='DESCENDING').limit(limit)
        
        submissions = []
        for doc in query.stream():
            submission_data = doc.to_dict()
            submission_data['id'] = doc.id
            submissions.append(submission_data)
        
        return submissions
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch contact submissions: {str(e)}"
        )
