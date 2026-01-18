import firebase_admin
from firebase_admin import credentials, firestore
import os
from .config import FIREBASE_CREDENTIALS_PATH

# Initialize Firebase Admin SDK
# The service account JSON file should be placed in the Project_Content directory
CREDENTIALS_PATH = os.path.join(os.path.dirname(__file__), '..', FIREBASE_CREDENTIALS_PATH)

# Check if Firebase is already initialized
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
    except FileNotFoundError:
        raise
    except Exception as e:
        raise

# Get Firestore client
db = firestore.client()

# Collection names
COLLECTIONS = {
    'users': 'users',
    'refresh_tokens': 'refresh_tokens',
    'password_reset_tokens': 'password_reset_tokens',
    'generated_content': 'generated_content',
    'content': 'content',
    'linked_accounts': 'linked_accounts',
    'notifications': 'notifications',
    'comments': 'comments',
    'subscriptions': 'subscriptions',
    'schedulers': 'schedulers',
    'peak_times': 'peak_times',
    'auto_responders': 'auto_responders',
    'insight_reports': 'insight_reports',
    'activities': 'activities',
    'posts': 'posts',
}


def get_collection(collection_name: str):
    """Get a Firestore collection reference"""
    return db.collection(collection_name)


def generate_id():
    """Generate a unique document ID"""
    return db.collection('_').document().id
