"""
OpenAI Client Configuration
Provides singleton OpenAI client for text and image generation
"""
from openai import OpenAI
from ..config import OPENAI_API_KEY

_openai_client = None


def get_openai_client():
    """Get or create OpenAI client singleton"""
    global _openai_client
    if _openai_client is None:
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set in environment variables")
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    return _openai_client
