"""
AWS S3 Upload Service for MediaMint
Handles uploading images and videos to S3
"""

import uuid
import base64
from datetime import datetime
from botocore.exceptions import ClientError
from ..config import AWS_S3_BUCKET, AWS_REGION
from .aws_clients import get_s3


def upload_file_to_s3(file_data: bytes, filename: str, content_type: str, folder: str = "uploads") -> str:
    """
    Upload a file to S3 and return a presigned URL for access
    
    Args:
        file_data: Binary file data
        filename: Original filename
        content_type: MIME type (e.g., 'image/jpeg', 'video/mp4')
        folder: S3 folder/prefix
    
    Returns:
        Presigned URL of the uploaded file (valid for 7 days)
    """
    try:
        s3_client = get_s3()
        
        # Generate unique filename
        file_extension = filename.split('.')[-1] if '.' in filename else 'bin'
        unique_filename = f"{folder}/{uuid.uuid4().hex}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.{file_extension}"
        
        # Upload to S3 without ACL (works with buckets that block public access)
        s3_client.put_object(
            Bucket=AWS_S3_BUCKET,
            Key=unique_filename,
            Body=file_data,
            ContentType=content_type
        )
        
        # Generate presigned URL for reading (valid for 7 days)
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': AWS_S3_BUCKET,
                'Key': unique_filename
            },
            ExpiresIn=604800  # 7 days in seconds
        )
        
        return url
        
    except ClientError as e:
        raise Exception(f"Failed to upload file to S3: {str(e)}")


def upload_base64_to_s3(base64_data: str, content_type: str, folder: str = "uploads") -> str:
    """
    Upload a base64 encoded file to S3
    
    Args:
        base64_data: Base64 encoded file data (with or without data URL prefix)
        content_type: MIME type (e.g., 'image/jpeg', 'video/mp4')
        folder: S3 folder/prefix
    
    Returns:
        Public URL of the uploaded file
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        
        # Decode base64
        file_data = base64.b64decode(base64_data)
        
        # Determine file extension from content type
        extension_map = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'video/quicktime': 'mov',
        }
        extension = extension_map.get(content_type, 'bin')
        filename = f"upload.{extension}"
        
        return upload_file_to_s3(file_data, filename, content_type, folder)
        
    except Exception as e:
        raise Exception(f"Failed to upload base64 file to S3: {str(e)}")


def delete_file_from_s3(file_url: str) -> bool:
    """
    Delete a file from S3 given its URL
    
    Args:
        file_url: Full S3 URL of the file
    
    Returns:
        True if deleted successfully
    """
    try:
        s3_client = get_s3()
        
        # Extract key from URL
        # URL format: https://bucket.s3.region.amazonaws.com/key
        key = file_url.split(f"{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/")[1]
        
        s3_client.delete_object(
            Bucket=AWS_S3_BUCKET,
            Key=key
        )
        
        return True
        
    except ClientError as e:
        return False
    except Exception as e:
        return False


def generate_presigned_upload_url(filename: str, content_type: str, folder: str = "uploads", expires_in: int = 3600) -> dict:
    """
    Generate a presigned URL for direct client-side upload to S3
    
    Args:
        filename: Original filename
        content_type: MIME type
        folder: S3 folder/prefix
        expires_in: URL expiration time in seconds
    
    Returns:
        Dict with upload_url and file_url
    """
    try:
        s3_client = get_s3()
        
        # Generate unique filename
        file_extension = filename.split('.')[-1] if '.' in filename else 'bin'
        unique_filename = f"{folder}/{uuid.uuid4().hex}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.{file_extension}"
        
        # Generate presigned URL for PUT
        upload_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': AWS_S3_BUCKET,
                'Key': unique_filename,
                'ContentType': content_type
            },
            ExpiresIn=expires_in
        )
        
        # The final public URL
        file_url = f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"
        
        return {
            'upload_url': upload_url,
            'file_url': file_url,
            'key': unique_filename,
            'expires_in': expires_in
        }
        
    except ClientError as e:
        raise Exception(f"Failed to generate presigned URL: {str(e)}")
