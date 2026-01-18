"""
AWS Client Configuration
S3 client for file storage. AI generation now uses OpenAI.
"""
import boto3
from ..config import AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET


def get_aws_session():
    """Create AWS session with credentials from environment"""
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        return boto3.Session(
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
    # Fall back to default credentials (IAM role, ~/.aws/credentials, etc.)
    return boto3.Session(region_name=AWS_REGION)


def get_s3_client():
    """Get S3 client for file storage"""
    session = get_aws_session()
    return session.client("s3", region_name=AWS_REGION)


# Singleton clients for reuse
_s3_client = None


def get_s3():
    """Get or create S3 client singleton"""
    global _s3_client
    if _s3_client is None:
        _s3_client = get_s3_client()
    return _s3_client


# Export bucket name from config
S3_BUCKET = AWS_S3_BUCKET
