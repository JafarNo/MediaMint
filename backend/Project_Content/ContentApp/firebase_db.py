from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from google.cloud.firestore_v1 import FieldFilter
from .firebase_config import db, COLLECTIONS, generate_id


class UserDB:
    collection = COLLECTIONS['users']
    
    @staticmethod
    def create(data: dict) -> dict:
        user_id = generate_id()
        user_data = {
            'id': user_id,
            'email': data.get('email'),
            'username': data.get('username'),
            'first_name': data.get('first_name'),
            'last_name': data.get('last_name'),
            'hashed_password': data.get('hashed_password'),
            'is_active': data.get('is_active', True),
            'role': data.get('role', 'user'),
            'phone_number': data.get('phone_number', ''),
            'created_at': datetime.now(timezone.utc)
        }
        db.collection(COLLECTIONS['users']).document(user_id).set(user_data)
        return user_data
    
    @staticmethod
    def get_by_id(user_id: str) -> Optional[dict]:
        doc = db.collection(COLLECTIONS['users']).document(user_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
    @staticmethod
    def get_by_username(username: str) -> Optional[dict]:
        docs = db.collection(COLLECTIONS['users']).where(
            filter=FieldFilter('username', '==', username)
        ).limit(1).get()
        for doc in docs:
            return doc.to_dict()
        return None
    
    @staticmethod
    def get_by_email(email: str) -> Optional[dict]:
        docs = db.collection(COLLECTIONS['users']).where(
            filter=FieldFilter('email', '==', email)
        ).limit(1).get()
        for doc in docs:
            return doc.to_dict()
        return None
    
    @staticmethod
    def update(user_id: str, data: dict) -> bool:
        try:
            db.collection(COLLECTIONS['users']).document(user_id).update(data)
            return True
        except Exception:
            return False
    
    @staticmethod
    def delete(user_id: str) -> bool:
        try:
            db.collection(COLLECTIONS['users']).document(user_id).delete()
            return True
        except Exception:
            return False


class RefreshTokenDB:
    collection = COLLECTIONS['refresh_tokens']
    
    @staticmethod
    def create(user_id: str, token: str, expires_at: datetime) -> dict:
        token_id = generate_id()
        token_data = {
            'id': token_id,
            'user_id': user_id,
            'token': token,
            'created_at': datetime.now(timezone.utc),
            'expires_at': expires_at,
            'revoked': False
        }
        db.collection(COLLECTIONS['refresh_tokens']).document(token_id).set(token_data)
        return token_data
    
    @staticmethod
    def get_by_token(token: str) -> Optional[dict]:
        docs = db.collection(COLLECTIONS['refresh_tokens']).where(
            filter=FieldFilter('token', '==', token)
        ).where(
            filter=FieldFilter('revoked', '==', False)
        ).limit(1).get()
        for doc in docs:
            return doc.to_dict()
        return None
    
    @staticmethod
    def revoke(token_id: str) -> bool:
        try:
            db.collection(COLLECTIONS['refresh_tokens']).document(token_id).update({
                'revoked': True
            })
            return True
        except Exception:
            return False
    
    @staticmethod
    def revoke_all_for_user(user_id: str) -> bool:
        try:
            docs = db.collection(COLLECTIONS['refresh_tokens']).where(
                filter=FieldFilter('user_id', '==', user_id)
            ).get()
            for doc in docs:
                doc.reference.update({'revoked': True})
            return True
        except Exception:
            return False

class PasswordResetTokenDB:
    collection = COLLECTIONS['password_reset_tokens']
    
    @staticmethod
    def create(email: str, token: str, expires_at: datetime) -> dict:
        token_id = generate_id()
        token_data = {
            'id': token_id,
            'email': email,
            'token': token,
            'created_at': datetime.now(timezone.utc),
            'expires_at': expires_at,
            'used': False
        }
        db.collection(COLLECTIONS['password_reset_tokens']).document(token_id).set(token_data)
        return token_data
    
    @staticmethod
    def get_by_token(token: str) -> Optional[dict]:
        docs = db.collection(COLLECTIONS['password_reset_tokens']).where(
            filter=FieldFilter('token', '==', token)
        ).where(
            filter=FieldFilter('used', '==', False)
        ).limit(1).get()
        for doc in docs:
            return doc.to_dict()
        return None
    
    @staticmethod
    def mark_as_used(token_id: str) -> bool:
        try:
            db.collection(COLLECTIONS['password_reset_tokens']).document(token_id).update({
                'used': True
            })
            return True
        except Exception:
            return False

class GeneratedContentDB:
    collection = COLLECTIONS['generated_content']
    
    @staticmethod
    def create(data: dict) -> dict:
        content_id = generate_id()
        content_data = {
            'id': content_id,
            'type': data.get('type'),
            'prompt': data.get('prompt'),
            'result_text': data.get('result_text'),
            'file_url': data.get('file_url'),
            'owner_id': data.get('owner_id'),
            'created_at': datetime.now(timezone.utc)
        }
        db.collection(COLLECTIONS['generated_content']).document(content_id).set(content_data)
        return content_data
    
    @staticmethod
    def get_by_id(content_id: str) -> Optional[dict]:
        doc = db.collection(COLLECTIONS['generated_content']).document(content_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
    @staticmethod
    def get_by_owner(owner_id: str, content_type: Optional[str] = None) -> List[dict]:
        query = db.collection(COLLECTIONS['generated_content']).where(
            filter=FieldFilter('owner_id', '==', owner_id)
        )
        if content_type:
            query = query.where(filter=FieldFilter('type', '==', content_type))
        
        query = query.order_by('created_at', direction='DESCENDING')
        
        docs = query.get()
        return [doc.to_dict() for doc in docs]
    
    @staticmethod
    def update(content_id: str, data: dict) -> bool:
        try:
            db.collection(COLLECTIONS['generated_content']).document(content_id).update(data)
            return True
        except Exception:
            return False
    
    @staticmethod
    def delete(content_id: str) -> bool:
        try:
            db.collection(COLLECTIONS['generated_content']).document(content_id).delete()
            return True
        except Exception:
            return False


class ContentDB:
    collection = COLLECTIONS['content']
    
    @staticmethod
    def create(data: dict) -> dict:
        """Create new content"""
        content_id = data.get('contentID') or generate_id()
        content_data = {
            'contentID': content_id,
            'title': data.get('title'),
            'type': data.get('type'),
            'mediaURL': data.get('mediaURL'),
            'language': data.get('language'),
            'createdAt': datetime.now(timezone.utc),
            'isApproved': data.get('isApproved', False),
            'status': data.get('status', 'draft'),
            'platform': data.get('platform'),
            'replied': data.get('replied', False),
            'userID': data.get('userID'),
            'schedulerID': data.get('schedulerID')
        }
        db.collection(COLLECTIONS['content']).document(content_id).set(content_data)
        return content_data
    
    @staticmethod
    def get_by_id(content_id: str) -> Optional[dict]:
        """Get content by ID"""
        doc = db.collection(COLLECTIONS['content']).document(content_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
    @staticmethod
    def get_by_user(user_id: str) -> List[dict]:
        """Get all content for a user"""
        docs = db.collection(COLLECTIONS['content']).where(
            filter=FieldFilter('userID', '==', user_id)
        ).order_by('createdAt', direction='DESCENDING').get()
        return [doc.to_dict() for doc in docs]
    
    @staticmethod
    def update(content_id: str, data: dict) -> bool:
        """Update content"""
        try:
            db.collection(COLLECTIONS['content']).document(content_id).update(data)
            return True
        except Exception:
            return False
    
    @staticmethod
    def delete(content_id: str) -> bool:
        """Delete content"""
        try:
            db.collection(COLLECTIONS['content']).document(content_id).delete()
            return True
        except Exception:
            return False



class LinkedAccountDB:
    collection = COLLECTIONS['linked_accounts']
    
    @staticmethod
    def create(data: dict) -> dict:
        """Create a new linked account"""
        account_id = data.get('accountID') or generate_id()
        account_data = {
            'accountID': account_id,
            'accessToken': data.get('accessToken'),
            'username': data.get('username'),
            'pageID': data.get('pageID'),
            'platform': data.get('platform'),
            'userID': data.get('userID'),
            'created_at': datetime.now(timezone.utc)
        }
        db.collection(COLLECTIONS['linked_accounts']).document(account_id).set(account_data)
        return account_data
    
    @staticmethod
    def get_by_user(user_id: str) -> List[dict]:
        """Get all linked accounts for a user"""
        docs = db.collection(COLLECTIONS['linked_accounts']).where(
            filter=FieldFilter('userID', '==', user_id)
        ).get()
        return [doc.to_dict() for doc in docs]
    
    @staticmethod
    def delete(account_id: str) -> bool:
        """Delete a linked account"""
        try:
            db.collection(COLLECTIONS['linked_accounts']).document(account_id).delete()
            return True
        except Exception:
            return False


class NotificationDB:
    collection = COLLECTIONS['notifications']
    
    @staticmethod
    def create(data: dict) -> dict:
        """Create a new notification"""
        notification_id = generate_id()
        notification_data = {
            'notificationID': notification_id,
            'type': data.get('type'),
            'message': data.get('message'),
            'sentAt': datetime.now(timezone.utc),
            'isRead': False,
            'userID': data.get('userID')
        }
        db.collection(COLLECTIONS['notifications']).document(notification_id).set(notification_data)
        return notification_data
    
    @staticmethod
    def get_by_user(user_id: str, unread_only: bool = False) -> List[dict]:
        """Get notifications for a user"""
        query = db.collection(COLLECTIONS['notifications']).where(
            filter=FieldFilter('userID', '==', user_id)
        )
        if unread_only:
            query = query.where(filter=FieldFilter('isRead', '==', False))
        
        docs = query.order_by('sentAt', direction='DESCENDING').get()
        return [doc.to_dict() for doc in docs]
    
    @staticmethod
    def mark_as_read(notification_id: str) -> bool:
        """Mark a notification as read"""
        try:
            db.collection(COLLECTIONS['notifications']).document(notification_id).update({
                'isRead': True
            })
            return True
        except Exception:
            return False



class SubscriptionDB:
    collection = COLLECTIONS['subscriptions']
    
    @staticmethod
    def create(data: dict) -> dict:
        """Create a new subscription"""
        subscription_id = generate_id()
        subscription_data = {
            'subscriptionID': subscription_id,
            'status': data.get('status'),
            'startDate': data.get('startDate'),
            'endDate': data.get('endDate'),
            'type': data.get('type'),
            'transactionID': data.get('transactionID'),
            'userID': data.get('userID')
        }
        db.collection(COLLECTIONS['subscriptions']).document(subscription_id).set(subscription_data)
        return subscription_data
    
    @staticmethod
    def get_by_user(user_id: str) -> Optional[dict]:
        """Get active subscription for a user"""
        docs = db.collection(COLLECTIONS['subscriptions']).where(
            filter=FieldFilter('userID', '==', user_id)
        ).where(
            filter=FieldFilter('status', '==', 'active')
        ).limit(1).get()
        for doc in docs:
            return doc.to_dict()
        return None
    
    @staticmethod
    def update(subscription_id: str, data: dict) -> bool:
        """Update subscription"""
        try:
            db.collection(COLLECTIONS['subscriptions']).document(subscription_id).update(data)
            return True
        except Exception:
            return False



class ActivityDB:
    collection = COLLECTIONS.get('activities', 'activities')
    
    @staticmethod
    def create(data: dict) -> dict:
        """Create a new activity record"""
        activity_id = generate_id()
        activity_data = {
            'id': activity_id,
            'user_id': data.get('user_id'),
            'type': data.get('type'),  # 'post_created', 'post_scheduled', 'response_generated'
            'action': data.get('action'),  # 'Created Post', 'Scheduled Post', 'Generated Response'
            'description': data.get('description'),
            'platform': data.get('platform'),  # 'instagram', 'facebook', etc.
            'content_type': data.get('content_type'),  # 'image', 'video', 'text'
            'content_id': data.get('content_id'),  # Reference to the content
            'metadata': data.get('metadata', {}),  # Additional data (caption, scheduled_time, etc.)
            'created_at': datetime.now(timezone.utc)
        }
        db.collection(ActivityDB.collection).document(activity_id).set(activity_data)
        return activity_data
    
    @staticmethod
    def get_by_user(user_id: str, limit: int = 50) -> List[dict]:
        """Get recent activities for a user"""
        try:
            # Try with ordering first (requires composite index)
            docs = db.collection(ActivityDB.collection).where(
                filter=FieldFilter('user_id', '==', user_id)
            ).order_by('created_at', direction='DESCENDING').limit(limit).get()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            # Fallback if composite index doesn't exist - fetch without ordering
            try:
                docs = db.collection(ActivityDB.collection).where(
                    filter=FieldFilter('user_id', '==', user_id)
                ).limit(limit).get()
                # Sort in Python as fallback
                activities = [doc.to_dict() for doc in docs]
                # Safe sort that handles missing or None created_at
                def get_sort_key(x):
                    created = x.get('created_at')
                    if created is None:
                        return datetime(1970, 1, 1, tzinfo=timezone.utc)
                    if hasattr(created, 'timestamp'):
                        return created
                    return datetime(1970, 1, 1, tzinfo=timezone.utc)
                activities.sort(key=get_sort_key, reverse=True)
                return activities
            except Exception as e2:
                return []
    
    @staticmethod
    def get_by_id(activity_id: str) -> Optional[dict]:
        """Get activity by ID"""
        doc = db.collection(ActivityDB.collection).document(activity_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
    @staticmethod
    def delete(activity_id: str) -> bool:
        """Delete an activity"""
        try:
            db.collection(ActivityDB.collection).document(activity_id).delete()
            return True
        except Exception:
            return False
    
    @staticmethod
    def get_recent(user_id: str, days: int = 7) -> List[dict]:
        """Get activities from the last N days"""
        from datetime import timedelta
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        docs = db.collection(ActivityDB.collection).where(
            filter=FieldFilter('user_id', '==', user_id)
        ).where(
            filter=FieldFilter('created_at', '>=', cutoff_date)
        ).order_by('created_at', direction='DESCENDING').get()
        return [doc.to_dict() for doc in docs]


class AutoresponderSettingsDB:
    collection = 'autoresponder_settings'
    
    @staticmethod
    def get_by_post(post_id: str) -> Optional[dict]:
        try:
            doc = db.collection(AutoresponderSettingsDB.collection).document(post_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception:
            return None
    
    @staticmethod
    def get_by_social_post_id(social_post_id: str) -> Optional[dict]:
        try:
            # Check facebook post ID
            docs = db.collection(AutoresponderSettingsDB.collection).where(
                filter=FieldFilter('social_post_ids.facebook', '==', social_post_id)
            ).limit(1).get()
            
            for doc in docs:
                return doc.to_dict()
            
            # Check instagram post ID
            docs = db.collection(AutoresponderSettingsDB.collection).where(
                filter=FieldFilter('social_post_ids.instagram', '==', social_post_id)
            ).limit(1).get()
            
            for doc in docs:
                return doc.to_dict()
                
            return None
        except Exception:
            return None
    
    @staticmethod
    def save(post_id: str, user_id: str, settings: dict) -> dict:
        try:
            data = {
                'post_id': post_id,
                'user_id': user_id,
                'enabled': settings.get('enabled', True),
                'tone': settings.get('tone', 'friendly'),
                'custom_instructions': settings.get('custom_instructions', ''),
                'response_delay_seconds': settings.get('response_delay_seconds', 30),
                'social_post_ids': settings.get('social_post_ids', {}),
                'post_caption': settings.get('post_caption', ''),
                'updated_at': datetime.now(timezone.utc)
            }
            
            # Check if exists
            existing = AutoresponderSettingsDB.get_by_post(post_id)
            if not existing:
                data['created_at'] = datetime.now(timezone.utc)
            
            db.collection(AutoresponderSettingsDB.collection).document(post_id).set(data, merge=True)
            return data
        except Exception as e:
            raise e
    
    @staticmethod
    def delete(post_id: str) -> bool:
        try:
            db.collection(AutoresponderSettingsDB.collection).document(post_id).delete()
            return True
        except Exception:
            return False
    
    @staticmethod
    def get_enabled_for_user(user_id: str) -> List[dict]:
        try:
            docs = db.collection(AutoresponderSettingsDB.collection).where(
                filter=FieldFilter('user_id', '==', user_id)
            ).where(
                filter=FieldFilter('enabled', '==', True)
            ).get()
            
            return [doc.to_dict() for doc in docs]
        except Exception:
            return []

    @staticmethod
    def get_all_active() -> List[dict]:
        try:
            docs = db.collection(AutoresponderSettingsDB.collection).where(
                filter=FieldFilter('enabled', '==', True)
            ).get()
            return [doc.to_dict() for doc in docs]
        except Exception:
            return []


class CommentThreadDB:
    collection = 'comment_threads'
    
    @staticmethod
    def record_response(data: dict) -> str:
        try:
            comment_id = data.get('comment_id')
            
            thread_data = {
                'id': comment_id,
                'post_id': data.get('post_id'),
                'social_post_id': data.get('social_post_id'),
                'comment_id': comment_id,
                'comment_text': data.get('comment_text'),
                'commenter_id': data.get('commenter_id'),
                'commenter_name': data.get('commenter_name'),
                'response_text': data.get('response_text'),
                'response_id': data.get('response_id'),
                'platform': data.get('platform'),
                'user_id': data.get('user_id'),
                'tone': data.get('tone'),
                'replied': True,
                'created_at': datetime.now(timezone.utc)
            }
            db.collection(CommentThreadDB.collection).document(comment_id).set(thread_data)
            return comment_id
        except Exception as e:
            raise e
    
    @staticmethod
    def get_by_post(post_id: str, limit: int = 50) -> List[dict]:
        try:
            docs = db.collection(CommentThreadDB.collection).where(
                filter=FieldFilter('post_id', '==', post_id)
            ).order_by('created_at', direction='DESCENDING').limit(limit).get()
            
            return [doc.to_dict() for doc in docs]
        except Exception:
            return []
    
    @staticmethod
    def has_responded_to_comment(comment_id: str) -> bool:
        try:
            doc = db.collection(CommentThreadDB.collection).document(comment_id).get()
            if doc.exists:
                data = doc.to_dict()
                return data.get('replied', False) == True
            return False
        except Exception:
            return False
    
    @staticmethod
    def mark_as_replied(comment_id: str) -> bool:
        try:
            doc_ref = db.collection(CommentThreadDB.collection).document(comment_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return False
            
            doc_ref.set({
                'id': comment_id,
                'comment_id': comment_id,
                'replied': False,
                'reserved_at': datetime.now(timezone.utc)
            })
            return True
        except Exception:
            return False


class SocialAccountDB:
    collection = COLLECTIONS['linked_accounts']
    
    @staticmethod
    def create(data: dict) -> dict:
        account_id = generate_id()
        account_data = {
            'accountID': account_id,
            'userID': data.get('userID'),
            'platform': data.get('platform'),
            'username': data.get('username'),
            'profile_picture_url': data.get('profile_picture_url'),
            'accessToken': data.get('accessToken'),
            'token_expires_at': data.get('token_expires_at'),
            'pageID': data.get('pageID'),
            'page_name': data.get('page_name'),
            'page_access_token': data.get('page_access_token'),
            'instagram_account_id': data.get('instagram_account_id'),
            'instagram_username': data.get('instagram_username'),
            'fb_user_id': data.get('fb_user_id'),
            'scopes': data.get('scopes', []),
            'is_active': True,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc)
        }
        db.collection(SocialAccountDB.collection).document(account_id).set(account_data)
        return account_data
    
    @staticmethod
    def get_by_id(account_id: str) -> Optional[dict]:
        doc = db.collection(SocialAccountDB.collection).document(account_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
    @staticmethod
    def get_by_user(user_id: str, platform: Optional[str] = None) -> List[dict]:
        query = db.collection(SocialAccountDB.collection).where(
            filter=FieldFilter('userID', '==', user_id)
        )
        
        if platform:
            query = query.where(filter=FieldFilter('platform', '==', platform))
        
        docs = query.get()
        return [doc.to_dict() for doc in docs]
    
    @staticmethod
    def get_by_page_id(page_id: str) -> Optional[dict]:
        docs = db.collection(SocialAccountDB.collection).where(
            filter=FieldFilter('pageID', '==', page_id)
        ).limit(1).get()
        
        for doc in docs:
            return doc.to_dict()
        return None
    
    @staticmethod
    def update(account_id: str, data: dict) -> bool:
        try:
            data['updated_at'] = datetime.now(timezone.utc)
            db.collection(SocialAccountDB.collection).document(account_id).update(data)
            return True
        except Exception:
            return False
    
    @staticmethod
    def delete(account_id: str) -> bool:
        try:
            db.collection(SocialAccountDB.collection).document(account_id).delete()
            return True
        except Exception:
            return False


class OAuthStateDB:
    collection = 'oauth_states'
    
    @staticmethod
    def create(user_id: str, platform: str, redirect_url: Optional[str] = None) -> str:
        import secrets
        from datetime import timedelta
        state = secrets.token_urlsafe(32)
        state_data = {
            'state': state,
            'user_id': user_id,
            'platform': platform,
            'redirect_url': redirect_url,
            'created_at': datetime.now(timezone.utc),
            'expires_at': datetime.now(timezone.utc) + timedelta(minutes=10),
            'used': False
        }
        db.collection(OAuthStateDB.collection).document(state).set(state_data)
        return state
    
    @staticmethod
    def get_and_validate(state: str) -> Optional[dict]:
        doc = db.collection(OAuthStateDB.collection).document(state).get()
        if not doc.exists:
            return None
        
        data = doc.to_dict()
        
        if data.get('used'):
            return None
        if data.get('expires_at') and data['expires_at'].replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            return None
        
        db.collection(OAuthStateDB.collection).document(state).update({'used': True})
        
        return data
    
    @staticmethod
    def delete(state: str):
        db.collection(OAuthStateDB.collection).document(state).delete()


class PublishedPostDB:
    """Track posts published to social platforms"""
    collection = 'published_posts'
    
    @staticmethod
    def create(data: dict) -> dict:
        """Record a published post"""
        record_id = generate_id()
        record_data = {
            'id': record_id,
            'internal_post_id': data.get('internal_post_id'),
            'user_id': data.get('user_id'),
            'account_id': data.get('account_id'),
            'platform': data.get('platform'),
            'platform_post_id': data.get('platform_post_id'),
            'media_type': data.get('media_type'),
            'status': data.get('status', 'published'),
            'error_message': data.get('error_message'),
            'published_at': datetime.now(timezone.utc)
        }
        db.collection(PublishedPostDB.collection).document(record_id).set(record_data)
        return record_data
    
    @staticmethod
    def get_by_internal_post(internal_post_id: str) -> List[dict]:
        """Get all published records for an internal post"""
        docs = db.collection(PublishedPostDB.collection).where(
            filter=FieldFilter('internal_post_id', '==', internal_post_id)
        ).get()
        return [doc.to_dict() for doc in docs]
