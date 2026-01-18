import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import threading
import logging

from ..firebase_config import db, COLLECTIONS
from ..firebase_db import ActivityDB, NotificationDB
from ..routers.social import AutoresponderSettingsDB, CommentThreadDB, SocialAccountDB
from .meta_service import MetaService, MetaAPIError
from .btext import generate_text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PostScheduler: 
    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._check_interval = 60  # Check every 60 seconds
        self._processing_comments = set()  # Track comments currently being processed
        
    async def start(self):
        if self._running:
            logger.warning("Scheduler is already running")
            return
            
        self._running = True
        self._task = asyncio.create_task(self._run_scheduler())
        logger.info("Post scheduler started - checking every minute")
        
    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Post scheduler stopped")
        
    async def _run_scheduler(self):
        while self._running:
            try:
                # 1. Publish scheduled posts
                await self._check_and_publish_due_posts()
                
                # 2. Check for new comments (Auto-Responder)
                await self._check_autoresponders()
                
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
            
            # Wait for next check interval
            await asyncio.sleep(self._check_interval)

    async def _check_autoresponders(self):
        try:
            # Get all enabled settings
            active_settings = AutoresponderSettingsDB.get_all_active()
            if not active_settings:
                # logger.info("   (No active auto-responders)")
                return

            logger.info(f"Checking {len(active_settings)} active auto-responders...")

            for setting in active_settings:
                try:
                    await self._process_auto_response_for_post(setting)
                except Exception as e:
                    logger.error(f"Error processing auto-responder for post {setting.get('post_id')}: {e}")

        except Exception as e:
            logger.error(f"Error checking auto-responders: {e}")

    async def _process_auto_response_for_post(self, setting: dict):
        user_id = setting.get('user_id')
        internal_post_id = setting.get('post_id')
        social_post_ids = setting.get('social_post_ids', {})
        
        if not social_post_ids:
            return

        # Get user accounts once
        accounts = SocialAccountDB.get_by_user(user_id)
        
        for platform, social_id in social_post_ids.items():
            # Find account for this platform
            account = next((a for a in accounts if a.get('platform') == platform), None)
            if not account:
                continue

            access_token = account.get('page_access_token') or account.get('accessToken')
            if not access_token:
                continue

            # Check comments
            meta_service = MetaService(access_token)
            try:
                if platform == 'facebook':
                    comments = await meta_service.get_post_comments(social_id)
                elif platform == 'instagram':
                    comments = await meta_service.get_instagram_media_comments(social_id)
                else:
                    comments = []

                # Process each comment
                for comment in comments:
                    comment_id = comment.get('id')
                    
                    if not comment_id:
                        continue

                    # Skip if we already responded (check replied flag in database)
                    if CommentThreadDB.has_responded_to_comment(comment_id):
                        continue
                    
                    # Skip if currently processing this comment (in-memory lock)
                    if comment_id in self._processing_comments:
                         continue
                    
                    # Try to reserve this comment in database to prevent race conditions
                    if not CommentThreadDB.mark_as_replied(comment_id):
                        # Another process already reserved this comment
                        continue
                         
                    # Add to processing set
                    self._processing_comments.add(comment_id)
                    
                    # Generate and Post Reply
                    try:
                        await self._generate_and_reply(
                            setting, account, platform, internal_post_id, social_id, comment, meta_service
                        )
                    finally:
                        # Remove from processing set when done
                        if comment_id in self._processing_comments:
                            self._processing_comments.remove(comment_id)

            except Exception as e:
                # Log error but don't crash scheduler
                # logger.error(f"Error polling comments for {platform} post {social_id}: {e}")
                pass 
            finally:
                await meta_service.close()

    async def _generate_and_reply(self, setting, account, platform, internal_post_id, social_post_id, comment, meta_service):
        comment_id = comment.get('id')
        comment_text = comment.get('message') or comment.get('text')
        commenter_name = comment.get('from', {}).get('name') or comment.get('username')
        commenter_id = comment.get('from', {}).get('id')
        
        if not comment_text:
            return

        logger.info(f" Found new comment on {platform}: '{comment_text}' by {commenter_name}")

        # AI Generation
        tone = setting.get('tone', 'friendly')
        custom_instructions = setting.get('custom_instructions', '')
        post_caption = setting.get('post_caption', '')
        
        tone_descriptions = {
            'friendly': 'warm, approachable, and personable with emojis',
            'professional': 'formal, business-like, and polished',
            'casual': 'relaxed, informal, and conversational',
            'enthusiastic': 'excited, energetic, and positive with emojis'
        }
        tone_desc = tone_descriptions.get(tone, tone_descriptions['friendly'])
        
        prompt = f"Act as an AI comment responder.\nTone: {tone_desc}\nUser comment: \"{comment_text}\"\n"
        
        if post_caption:
            prompt += f'Post context: "{post_caption}"\n'
        if custom_instructions:
            prompt += f'Instructions: {custom_instructions}\n'
            
        prompt += "\nGenerate a concise (under 100 words), natural response. Output ONLY the response text."

        # Try to generate AI response, fall back to standard message on failure
        response_text = ""
        try:
            response_text = generate_text(prompt).strip()
            # Remove quotes if AI added them
            if response_text.startswith('"') and response_text.endswith('"'):
                response_text = response_text[1:-1]
            logger.info(f"🤖 Generated reply: {response_text}")
        except Exception as e:
            logger.error(f"⚠️ AI Generation failed: {e}. Using fallback.")
            response_text = "Thanks for your interaction!"

        if not response_text:
            return

        try:
            # Post Reply
            if platform == 'facebook':
                await meta_service.reply_to_comment(comment_id, response_text)
            elif platform == 'instagram':
                await meta_service.reply_to_instagram_comment(comment_id, response_text)
            
            # Record it
            CommentThreadDB.record_response({
                'post_id': internal_post_id,
                'social_post_id': social_post_id,
                'comment_id': comment_id,
                'comment_text': comment_text,
                'commenter_id': commenter_id,
                'commenter_name': commenter_name,
                'response_text': response_text,
                'platform': platform,
                'user_id': setting.get('user_id'),
                'tone': tone
            })
            logger.info(f"✅ Auto-responded to comment {comment_id}")

        except Exception as e:
            logger.error(f"Failed to post reply: {e}")

  
    
    async def _check_and_publish_due_posts(self):
        logger.info(f"Checking for scheduled posts at {datetime.now(timezone.utc).isoformat()}")
        
        try:
            # Get all scheduled posts that are due
            due_posts = self._get_due_posts()
            
            if not due_posts:
                logger.info("No posts due for publishing")
                return
                
            logger.info(f"Found {len(due_posts)} posts due for publishing")
            
            for post in due_posts:
                post_id = post.get('id')
                try:
                    # Mark as publishing FIRST to prevent duplicate processing
                    if not self._mark_as_publishing(post_id):
                        logger.info(f"Post {post_id} already being processed, skipping")
                        continue
                    
                    await self._publish_post(post)
                except Exception as e:
                    logger.error(f"Failed to publish post {post_id}: {e}")
                    # Update post status to failed
                    self._update_post_status(post_id, 'failed', str(e))
                    
        except Exception as e:
            logger.error(f"Error checking due posts: {e}")
    
    def _mark_as_publishing(self, post_id: str) -> bool:
        """
        Atomically mark a post as 'publishing' to prevent duplicate processing.
        Returns True if successfully marked, False if already being processed.
        """
        from google.cloud import firestore
        
        try:
            post_ref = db.collection('posts').document(post_id)
            
            @firestore.transactional
            def update_in_transaction(transaction):
                snapshot = post_ref.get(transaction=transaction)
                if not snapshot.exists:
                    return False
                
                current_status = snapshot.get('status')
                # Only proceed if still 'scheduled'
                if current_status != 'scheduled':
                    return False
                
                # Mark as publishing
                transaction.update(post_ref, {
                    'status': 'publishing',
                    'publishing_started_at': datetime.now(timezone.utc)
                })
                return True
            
            transaction = db.transaction()
            return update_in_transaction(transaction)
            
        except Exception as e:
            logger.error(f"Error marking post as publishing: {e}")
            return False
    
    def _get_due_posts(self) -> List[dict]:
        from google.cloud.firestore_v1 import FieldFilter
        
        now = datetime.now(timezone.utc)
        logger.info(f"Current time (UTC): {now.isoformat()}")
        
        try:
            docs = db.collection('posts').where(
                filter=FieldFilter('status', '==', 'scheduled')
            ).get()
            
            all_scheduled = list(docs)
            logger.info(f"Found {len(all_scheduled)} posts with status 'scheduled'")
            
            due_posts = []
            for doc in all_scheduled:
                post = doc.to_dict()
                post['id'] = doc.id  # Ensure we have the document ID
                
                scheduled_at = post.get('scheduled_at')
                # logger.info(f"   - Post {doc.id}: scheduled_at={scheduled_at} (type: {type(scheduled_at).__name__})")
                
                if not scheduled_at:
                    logger.warning(f"   Post {doc.id} has no scheduled_at field")
                    continue
                
                # Handle various datetime formats
                if isinstance(scheduled_at, str):
                    try:
                        scheduled_at = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
                    except ValueError:
                        logger.warning(f"   Invalid scheduled_at format for post {doc.id}: {scheduled_at}")
                        continue
                elif hasattr(scheduled_at, 'timestamp'):
                    # Handle Firestore Timestamp objects
                    scheduled_at = datetime.fromtimestamp(scheduled_at.timestamp(), tz=timezone.utc)
                elif not isinstance(scheduled_at, datetime):
                    logger.warning(f"   Unknown scheduled_at type for post {doc.id}: {type(scheduled_at)}")
                    continue
                
                # Ensure timezone awareness
                if scheduled_at.tzinfo is None:
                    scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
                
                # Check if post is due (scheduled time has passed or is now)
                is_due = scheduled_at <= now
                # logger.info(f"   - Post {doc.id}: scheduled_at={scheduled_at.isoformat()}, is_due={is_due}")
                
                if is_due:
                    due_posts.append(post)
                    
            return due_posts
            
        except Exception as e:
            logger.error(f"Error fetching due posts: {e}")
            return []
    
    async def _publish_post(self, post: dict):
        post_id = post.get('id')
        user_id = post.get('user_id')
        platforms = post.get('platforms', [])
        media_url = post.get('media_url')
        caption = post.get('caption', '')
        media_type = post.get('media_type', 'image')
        
        logger.info(f" Publishing post {post_id}")
        logger.info(f"   - user_id: {user_id}")
        logger.info(f"   - platforms: {platforms}")
        logger.info(f"   - media_url: {media_url[:50] if media_url else 'None'}...")
        logger.info(f"   - media_type: {media_type}")
        
        if not platforms:
            logger.warning(f" Post {post_id} has no platforms specified")
            self._update_post_status(post_id, 'failed', 'No platforms specified')
            return
            
        if not media_url:
            logger.warning(f"Post {post_id} has no media URL")
            self._update_post_status(post_id, 'failed', 'No media URL')
            return
        
        # Get user's connected social accounts
        connected_accounts = self._get_user_accounts(user_id)
        
        if not connected_accounts:
            logger.warning(f"User {user_id} has no connected social accounts")
            self._update_post_status(post_id, 'failed', 'No connected social accounts')
            return
        
        publish_results = []
        successful_platforms = []
        failed_platforms = []
        
        for platform in platforms:
            # Find matching account for this platform
            account = self._find_account_for_platform(connected_accounts, platform)
            
            if not account:
                logger.warning(f" No connected account found for platform: {platform}")
                failed_platforms.append({
                    'platform': platform,
                    'error': 'No connected account'
                })
                continue
            
            try:
                result = await self._publish_to_platform(
                    account=account,
                    platform=platform,
                    media_url=media_url,
                    caption=caption,
                    media_type=media_type,
                    post_id=post_id,
                    user_id=user_id
                )
                
                successful_platforms.append({
                    'platform': platform,
                    'platform_post_id': result.get('platform_post_id')
                })
                
                logger.info(f" Successfully published to {platform}")
                
            except Exception as e:
                logger.error(f" Failed to publish to {platform}: {e}")
                failed_platforms.append({
                    'platform': platform,
                    'error': str(e)
                })
        
        # Build social_post_ids map from successful platforms
        social_post_ids = {}
        for p in successful_platforms:
            if p.get('platform_post_id'):
                social_post_ids[p['platform']] = p['platform_post_id']
        
        # Update post status based on results
        if successful_platforms and not failed_platforms:
            # All platforms succeeded
            self._update_post_status(post_id, 'published', social_post_ids=social_post_ids)
            self._create_activity(user_id, post, 'published', successful_platforms)
            self._create_notification(user_id, f"Your post has been published to {', '.join([p['platform'] for p in successful_platforms])}")
        elif successful_platforms and failed_platforms:
            # Partial success
            self._update_post_status(post_id, 'partially_published', 
                f"Published to: {[p['platform'] for p in successful_platforms]}, Failed: {[p['platform'] for p in failed_platforms]}",
                social_post_ids=social_post_ids)
            self._create_activity(user_id, post, 'partially_published', successful_platforms)
            self._create_notification(user_id, f"Your post was partially published. Some platforms failed.")
        else:
            # All failed
            self._update_post_status(post_id, 'failed', 
                f"Failed to publish to all platforms: {[p['error'] for p in failed_platforms]}")
            self._create_notification(user_id, f"Failed to publish your scheduled post. Please try again.")
    
    def _get_user_accounts(self, user_id: str) -> List[dict]:
        """Get all connected social accounts for a user"""
        from google.cloud.firestore_v1 import FieldFilter
        
        try:
            # Query by userID only to avoid composite index requirement
            # Then filter is_active in Python
            docs = db.collection(COLLECTIONS['linked_accounts']).where(
                filter=FieldFilter('userID', '==', user_id)
            ).get()
            
            accounts = []
            for doc in docs:
                account = doc.to_dict()
                # Filter active accounts in Python
                if account.get('is_active', True):  # Default to True if not set
                    accounts.append(account)
            
            logger.info(f"  Found {len(accounts)} connected accounts for user {user_id}")
            return accounts
        except Exception as e:
            logger.error(f"Error fetching user accounts: {e}")
            return []
    
    def _find_account_for_platform(self, accounts: List[dict], platform: str) -> Optional[dict]:
        """Find a connected account for the specified platform"""
        platform_lower = platform.lower()
        
        for account in accounts:
            account_platform = account.get('platform', '').lower()
            
            # Direct platform match
            if account_platform == platform_lower:
                return account
            
            # Instagram can be posted via Facebook page with Instagram business account
            if platform_lower == 'instagram' and account.get('instagram_account_id'):
                return account
                
        return None
    
    async def _publish_to_platform(
        self,
        account: dict,
        platform: str,
        media_url: str,
        caption: str,
        media_type: str,
        post_id: str,
        user_id: str
    ) -> dict:
        access_token = account.get('page_access_token') or account.get('accessToken')
        
        if not access_token:
            raise Exception("No access token available for account")
        
        meta_service = MetaService(access_token)
        platform_post_id = None
        
        try:
            platform_lower = platform.lower()
            
            if platform_lower == 'facebook':
                page_id = account.get('pageID')
                page_token = account.get('page_access_token')
                
                if not page_id:
                    raise Exception("No Facebook page ID found")
                
                # Determine media type for Facebook API
                fb_media_type = 'video' if media_type == 'video' else 'photo'
                
                if media_type == 'reel':
                    result = await meta_service.post_facebook_reel(
                        page_id, page_token, media_url, caption
                    )
                else:
                    result = await meta_service.post_to_facebook_page(
                        page_id, page_token, caption,
                        media_url=media_url, media_type=fb_media_type
                    )
                
                platform_post_id = result.get('id') or result.get('post_id')
                
            elif platform_lower == 'instagram':
                instagram_id = account.get('instagram_account_id')
                page_token = account.get('page_access_token')
                
                if not instagram_id:
                    raise Exception("No Instagram business account connected")
                
                # Determine media type for Instagram API
                ig_media_type = 'VIDEO' if media_type == 'video' else 'IMAGE'
                
                if media_type == 'reel':
                    result = await meta_service.post_instagram_reel(
                        instagram_id, page_token, media_url, caption
                    )
                else:
                    result = await meta_service.post_to_instagram(
                        instagram_id, page_token, media_url, caption, ig_media_type
                    )
                
                platform_post_id = result.get('id')
                
            else:
                raise Exception(f"Unsupported platform: {platform}")
            
            # Record the published post
            self._record_published_post(
                internal_post_id=post_id,
                user_id=user_id,
                account_id=account.get('accountID'),
                platform=platform,
                platform_post_id=platform_post_id,
                media_type=media_type,
                status='published'
            )
            
            return {'platform_post_id': platform_post_id}
            
        except MetaAPIError as e:
            # Record failed attempt
            self._record_published_post(
                internal_post_id=post_id,
                user_id=user_id,
                account_id=account.get('accountID'),
                platform=platform,
                platform_post_id=None,
                media_type=media_type,
                status='failed',
                error_message=e.message
            )
            raise Exception(e.message)
            
        finally:
            await meta_service.close()
    
    def _update_post_status(self, post_id: str, status: str, error_message: str = None, social_post_ids: dict = None):
        try:
            update_data = {
                'status': status,
                'updated_at': datetime.now(timezone.utc)
            }
            
            if status == 'published':
                update_data['published_at'] = datetime.now(timezone.utc)
                
            if error_message:
                update_data['error_message'] = error_message
            
            # Save the social media post IDs for comment fetching
            if social_post_ids:
                update_data['social_post_ids'] = social_post_ids
                logger.info(f"📝 Saving social_post_ids: {social_post_ids}")
                
            db.collection('posts').document(post_id).update(update_data)
            logger.info(f"📝 Updated post {post_id} status to: {status}")
            
            # Update autoresponder settings with social_post_ids if available
            if social_post_ids:
                try:
                    # Check if autoresponder settings exist for this post
                    current_settings = AutoresponderSettingsDB.get_by_post(post_id)
                    if current_settings:
                        # Update with new social IDs
                        user_id = current_settings.get('user_id')
                        # Merge new IDs with existing ones
                        existing_ids = current_settings.get('social_post_ids', {})
                        existing_ids.update(social_post_ids)
                        
                        settings_update = {
                            'enabled': current_settings.get('enabled'),
                            'tone': current_settings.get('tone'),
                            'custom_instructions': current_settings.get('custom_instructions'),
                            'response_delay_seconds': current_settings.get('response_delay_seconds'),
                            'social_post_ids': existing_ids,
                            'post_caption': current_settings.get('post_caption')
                        }
                        AutoresponderSettingsDB.save(post_id, user_id, settings_update)
                        logger.info(f"Updated autoresponder settings with social IDs for post {post_id}")
                except Exception as e:
                    logger.error(f"Failed to update autoresponder settings: {e}")
            
        except Exception as e:
            logger.error(f"Failed to update post status: {e}")
    
    def _record_published_post(
        self,
        internal_post_id: str,
        user_id: str,
        account_id: str,
        platform: str,
        platform_post_id: Optional[str],
        media_type: str,
        status: str,
        error_message: str = None
    ):
        """Record a published post in the database"""
        from ..firebase_config import generate_id
        
        try:
            record_id = generate_id()
            record_data = {
                'id': record_id,
                'internal_post_id': internal_post_id,
                'user_id': user_id,
                'account_id': account_id,
                'platform': platform,
                'platform_post_id': platform_post_id,
                'media_type': media_type,
                'status': status,
                'error_message': error_message,
                'published_at': datetime.now(timezone.utc)
            }
            db.collection('published_posts').document(record_id).set(record_data)
            
        except Exception as e:
            logger.error(f"Failed to record published post: {e}")
    
    def _create_activity(self, user_id: str, post: dict, status: str, platforms: List[dict]):
        """Create an activity record for the published post"""
        try:
            platform_names = ', '.join([p['platform'] for p in platforms])
            
            ActivityDB.create({
                'user_id': user_id,
                'type': 'post_published',
                'action': 'Published Scheduled Post',
                'description': f'Automatically published {post.get("media_type", "post")} to {platform_names}',
                'platform': platforms[0]['platform'] if platforms else None,
                'content_type': post.get('media_type'),
                'content_id': post.get('id'),
                'metadata': {
                    'platforms': [p['platform'] for p in platforms],
                    'scheduled_at': str(post.get('scheduled_at')),
                    'status': status
                }
            })
        except Exception as e:
            logger.error(f"Failed to create activity: {e}")
    
    def _create_notification(self, user_id: str, message: str):
        """Create a notification for the user"""
        try:
            NotificationDB.create({
                'userID': user_id,
                'type': 'scheduled_post',
                'message': message
            })
        except Exception as e:
            logger.error(f" Failed to create notification: {e}")


# Global scheduler instance
_scheduler: Optional[PostScheduler] = None


def get_scheduler() -> PostScheduler:
    """Get the global scheduler instance"""
    global _scheduler
    if _scheduler is None:
        _scheduler = PostScheduler()
    return _scheduler


async def start_scheduler():
    """Start the global scheduler"""
    scheduler = get_scheduler()
    await scheduler.start()


async def stop_scheduler():
    """Stop the global scheduler"""
    scheduler = get_scheduler()
    await scheduler.stop()
