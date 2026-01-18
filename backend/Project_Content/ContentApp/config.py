"""
Configuration module for MediaMint Backend
Loads environment variables from .env file
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Helper function to get required env vars
def get_required_env(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise ValueError(f"Required environment variable '{key}' is not set")
    return value

# JWT Configuration
SECRET_KEY = get_required_env('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-service-account.json')

# AWS Configuration (S3 for storage)
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
AWS_ACCESS_KEY_ID = get_required_env('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = get_required_env('AWS_SECRET_ACCESS_KEY')
AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET', 'genereated-content-bucket')

# OpenAI Configuration
OPENAI_API_KEY = get_required_env('OPENAI_API_KEY')

# Server Configuration
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', '8000'))
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

# CORS Configuration
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')

# Email Configuration (for password reset)
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@mediamint.com')

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# Meta (Facebook/Instagram) API Configuration
META_APP_ID = get_required_env('META_APP_ID')
META_APP_SECRET = get_required_env('META_APP_SECRET')
META_REDIRECT_URI = get_required_env('META_REDIRECT_URI')
META_GRAPH_API_VERSION = os.getenv('META_GRAPH_API_VERSION', 'v18.0')
META_GRAPH_API_BASE = f'https://graph.facebook.com/{META_GRAPH_API_VERSION}'
