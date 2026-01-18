"""
Meta (Facebook/Instagram) API Service
Handles all interactions with Meta Graph API for posting content,
managing comments, and handling DMs.
"""

import httpx
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from ..config import (
    META_APP_ID,
    META_APP_SECRET,
    META_REDIRECT_URI,
    META_GRAPH_API_VERSION,
    META_GRAPH_API_BASE
)


class MetaAPIError(Exception):
    """Custom exception for Meta API errors"""
    def __init__(self, message: str, error_code: Optional[int] = None, error_subcode: Optional[int] = None):
        self.message = message
        self.error_code = error_code
        self.error_subcode = error_subcode
        super().__init__(self.message)


class MetaService:
    """Service for interacting with Meta Graph API"""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = META_GRAPH_API_BASE
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    def _format_number(self, num: int) -> str:
        """Format number with K/M suffix"""
        if num >= 1000000:
            return f"{num / 1000000:.1f}M"
        if num >= 1000:
            return f"{num / 1000:.1f}K"
        return str(num)
    
    def _get_headers(self) -> Dict[str, str]:
        """Get default headers for API requests"""
        return {
            "Content-Type": "application/json"
        }
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
        files: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make a request to the Meta Graph API"""
        url = f"{self.base_url}/{endpoint}"
        
        # Always include access token
        if params is None:
            params = {}
        params["access_token"] = self.access_token
        
        try:
            if method == "GET":
                response = await self.client.get(url, params=params)
            elif method == "POST":
                if files:
                    response = await self.client.post(url, params=params, files=files)
                elif data:
                    response = await self.client.post(url, params=params, json=data)
                else:
                    response = await self.client.post(url, params=params)
            elif method == "DELETE":
                response = await self.client.delete(url, params=params)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            result = response.json()
            
            # Handle boolean response (sometimes returned by DELETE)
            if isinstance(result, bool):
                return {"success": result}
            
            # Handle list response (should use get-based check)
            if isinstance(result, dict) and "error" in result:
                error = result["error"]
                raise MetaAPIError(
                    message=error.get("message", "Unknown error"),
                    error_code=error.get("code"),
                    error_subcode=error.get("error_subcode")
                )
            
            return result
            
        except httpx.HTTPError as e:
            raise MetaAPIError(f"HTTP error: {str(e)}")
    
    @staticmethod
    def get_oauth_url(state: str, scopes: List[str] = None) -> str:
        """Generate OAuth URL for user authorization"""
        if scopes is None:
            # Permissions for Development mode
            # Using only Facebook permissions for now
            scopes = [
                "public_profile",
                "email",
                # Facebook Page permissions
                "pages_show_list",
                "pages_read_engagement",
                "pages_manage_posts",
                "pages_manage_engagement",
                "pages_manage_metadata",  # Required for webhook subscriptions
                "business_management",
            ]
        
        scope_str = ",".join(scopes)
        oauth_url = (
            f"https://www.facebook.com/{META_GRAPH_API_VERSION}/dialog/oauth?"
            f"client_id={META_APP_ID}"
            f"&redirect_uri={META_REDIRECT_URI}"
            f"&scope={scope_str}"
            f"&state={state}"
            f"&response_type=code"
        )
        return oauth_url
    
    @staticmethod
    async def exchange_code_for_token(code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        url = f"{META_GRAPH_API_BASE}/oauth/access_token"
        params = {
            "client_id": META_APP_ID,
            "client_secret": META_APP_SECRET,
            "redirect_uri": META_REDIRECT_URI,
            "code": code
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            result = response.json()
            
            if "error" in result:
                error_msg = result["error"].get("message", "Token exchange failed")
                error_type = result["error"].get("type", "Unknown")
                raise MetaAPIError(error_msg)
            
            return result
    
    @staticmethod
    async def get_long_lived_token(short_lived_token: str) -> Dict[str, Any]:
        """Exchange short-lived token for long-lived token (60 days)"""
        url = f"{META_GRAPH_API_BASE}/oauth/access_token"
        params = {
            "grant_type": "fb_exchange_token",
            "client_id": META_APP_ID,
            "client_secret": META_APP_SECRET,
            "fb_exchange_token": short_lived_token
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            result = response.json()
            
            if "error" in result:
                raise MetaAPIError(result["error"].get("message", "Long-lived token exchange failed"))
            
            return result
    
    
    async def get_user_info(self) -> Dict[str, Any]:
        """Get current user information"""
        return await self._make_request("GET", "me", params={"fields": "id,name,email"})
    
    async def get_pages(self) -> List[Dict[str, Any]]:
        """Get list of Facebook pages the user manages"""
        result = await self._make_request(
            "GET",
            "me/accounts",
            params={"fields": "id,name,access_token,instagram_business_account"}
        )
        return result.get("data", [])
    
    async def get_instagram_account(self, page_id: str, page_access_token: str) -> Optional[Dict[str, Any]]:
        """Get Instagram Business Account connected to a Facebook page"""
        self.access_token = page_access_token
        result = await self._make_request(
            "GET",
            f"{page_id}",
            params={"fields": "instagram_business_account{id,username,profile_picture_url,followers_count}"}
        )
        return result.get("instagram_business_account")

    async def post_to_facebook_page(
        self,
        page_id: str,
        page_access_token: str,
        message: str,
        link: Optional[str] = None,
        media_url: Optional[str] = None,
        media_type: str = "photo"
    ) -> Dict[str, Any]:
        """
        Post content to a Facebook page
        
        Args:
            page_id: Facebook Page ID
            page_access_token: Page access token
            message: Post caption/message
            link: Optional link to share
            media_url: URL of media to post (image or video)
            media_type: 'photo' or 'video'
        """
        self.access_token = page_access_token
        
        if media_url:
            if media_type == "video":
                # Video post
                endpoint = f"{page_id}/videos"
                params = {
                    "file_url": media_url,
                    "description": message
                }
            else:
                # Photo post
                endpoint = f"{page_id}/photos"
                params = {
                    "url": media_url,
                    "caption": message
                }
            return await self._make_request("POST", endpoint, params=params)
        elif link:
            # Link post
            endpoint = f"{page_id}/feed"
            params = {
                "message": message,
                "link": link
            }
            return await self._make_request("POST", endpoint, params=params)
        else:
            # Text-only post
            endpoint = f"{page_id}/feed"
            params = {"message": message}
            return await self._make_request("POST", endpoint, params=params)
    
    async def post_facebook_story(
        self,
        page_id: str,
        page_access_token: str,
        media_url: str,
        media_type: str = "photo"
    ) -> Dict[str, Any]:
        """Post a story to Facebook page"""
        self.access_token = page_access_token
        
        if media_type == "video":
            endpoint = f"{page_id}/video_stories"
            params = {"video_url": media_url}
        else:
            endpoint = f"{page_id}/photo_stories"
            params = {"photo_url": media_url}
        
        return await self._make_request("POST", endpoint, params=params)
    
    async def post_facebook_reel(
        self,
        page_id: str,
        page_access_token: str,
        video_url: str,
        description: str = ""
    ) -> Dict[str, Any]:
        """Post a Reel to Facebook page"""
        self.access_token = page_access_token
        
        # Step 1: Initialize upload
        init_result = await self._make_request(
            "POST",
            f"{page_id}/video_reels",
            params={
                "upload_phase": "start"
            }
        )
        
        video_id = init_result.get("video_id")
        
        # Step 2: Upload video
        await self._make_request(
            "POST",
            f"{video_id}",
            params={
                "upload_phase": "transfer",
                "file_url": video_url
            }
        )
        
        # Step 3: Finish and publish
        return await self._make_request(
            "POST",
            f"{page_id}/video_reels",
            params={
                "upload_phase": "finish",
                "video_id": video_id,
                "description": description
            }
        )

    async def delete_post(self, post_id: str, page_access_token: str) -> bool:
        """Delete a post from Facebook or Instagram"""
        self.access_token = page_access_token
        result = await self._make_request("DELETE", post_id)
        return result.get("success", False)
    
    async def post_to_instagram(
        self,
        instagram_account_id: str,
        page_access_token: str,
        media_url: str,
        caption: str,
        media_type: str = "IMAGE"
    ) -> Dict[str, Any]:
        """
        Post content to Instagram
        
        Args:
            instagram_account_id: Instagram Business Account ID
            page_access_token: Page access token (Instagram uses page token)
            media_url: Public URL of media
            caption: Post caption
            media_type: 'IMAGE', 'VIDEO', or 'CAROUSEL'
        """
        self.access_token = page_access_token
        
        # Step 1: Create media container
        container_params = {
            "caption": caption
        }
        
        if media_type == "VIDEO":
            container_params["media_type"] = "VIDEO"
            container_params["video_url"] = media_url
        else:
            container_params["image_url"] = media_url
        
        container_result = await self._make_request(
            "POST",
            f"{instagram_account_id}/media",
            params=container_params
        )
        
        creation_id = container_result.get("id")
        
        # Step 2: Wait for container to be ready (for videos)
        if media_type == "VIDEO":
            import asyncio
            for _ in range(30):  # Max 30 attempts
                status_result = await self._make_request(
                    "GET",
                    f"{creation_id}",
                    params={"fields": "status_code"}
                )
                if status_result.get("status_code") == "FINISHED":
                    break
                await asyncio.sleep(2)
        
        # Step 3: Publish the container
        return await self._make_request(
            "POST",
            f"{instagram_account_id}/media_publish",
            params={"creation_id": creation_id}
        )
    
    async def post_instagram_story(
        self,
        instagram_account_id: str,
        page_access_token: str,
        media_url: str,
        media_type: str = "IMAGE"
    ) -> Dict[str, Any]:
        """Post a story to Instagram"""
        self.access_token = page_access_token
        
        # Create story container
        container_params = {
            "media_type": "STORIES"
        }
        
        if media_type == "VIDEO":
            container_params["video_url"] = media_url
        else:
            container_params["image_url"] = media_url
        
        container_result = await self._make_request(
            "POST",
            f"{instagram_account_id}/media",
            params=container_params
        )
        
        creation_id = container_result.get("id")
        
        # Wait for processing if video
        if media_type == "VIDEO":
            import asyncio
            for _ in range(30):
                status_result = await self._make_request(
                    "GET",
                    f"{creation_id}",
                    params={"fields": "status_code"}
                )
                if status_result.get("status_code") == "FINISHED":
                    break
                await asyncio.sleep(2)
        
        # Publish
        return await self._make_request(
            "POST",
            f"{instagram_account_id}/media_publish",
            params={"creation_id": creation_id}
        )
    
    async def post_instagram_reel(
        self,
        instagram_account_id: str,
        page_access_token: str,
        video_url: str,
        caption: str,
        cover_url: Optional[str] = None,
        share_to_feed: bool = True
    ) -> Dict[str, Any]:
        """Post a Reel to Instagram"""
        self.access_token = page_access_token
        
        # Create reel container
        container_params = {
            "media_type": "REELS",
            "video_url": video_url,
            "caption": caption,
            "share_to_feed": str(share_to_feed).lower()
        }
        
        if cover_url:
            container_params["cover_url"] = cover_url
        
        container_result = await self._make_request(
            "POST",
            f"{instagram_account_id}/media",
            params=container_params
        )
        
        creation_id = container_result.get("id")
        
        # Wait for processing
        import asyncio
        for _ in range(60):  # Reels may take longer
            status_result = await self._make_request(
                "GET",
                f"{creation_id}",
                params={"fields": "status_code"}
            )
            if status_result.get("status_code") == "FINISHED":
                break
            await asyncio.sleep(2)
        
        # Publish
        return await self._make_request(
            "POST",
            f"{instagram_account_id}/media_publish",
            params={"creation_id": creation_id}
        )
    
   
    
    async def get_post_comments(
        self,
        post_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get comments on a post"""
        result = await self._make_request(
            "GET",
            f"{post_id}/comments",
            params={
                "fields": "id,message,from{id,name},created_time",
                "limit": limit
            }
        )
        return result.get("data", [])
    
    async def reply_to_comment(
        self,
        comment_id: str,
        message: str
    ) -> Dict[str, Any]:
        """Reply to a comment (Facebook uses /comments edge for replies)"""
        return await self._make_request(
            "POST",
            f"{comment_id}/comments",
            params={"message": message}
        )
    
    async def delete_comment(self, comment_id: str) -> bool:
        """Delete a comment"""
        result = await self._make_request("DELETE", comment_id)
        return result.get("success", False)
    
    async def hide_comment(self, comment_id: str, hide: bool = True) -> bool:
        """Hide or unhide a comment"""
        result = await self._make_request(
            "POST",
            comment_id,
            params={"is_hidden": str(hide).lower()}
        )
        return result.get("success", False)
     
    async def get_instagram_media_comments(
        self,
        media_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        result = await self._make_request(
            "GET",
            f"{media_id}/comments",
            params={
                "fields": "id,text,username,timestamp,replies{id,text,username,timestamp}",
                "limit": limit
            }
        )
        return result.get("data", [])
    
    async def reply_to_instagram_comment(
        self,
        comment_id: str,
        message: str
    ) -> Dict[str, Any]:
        """Reply to an Instagram comment"""
        return await self._make_request(
            "POST",
            f"{comment_id}/replies",
            params={"message": message}
        )
    
    
    async def get_conversations(
        self,
        page_id: str,
        page_access_token: str,
        platform: str = "facebook",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        self.access_token = page_access_token
        
        if platform == "instagram":
            endpoint = f"{page_id}/conversations"
            params = {
                "platform": "instagram",
                "fields": "id,participants,messages{id,message,from,created_time}",
                "limit": limit
            }
        else:
            endpoint = f"{page_id}/conversations"
            params = {
                "fields": "id,participants,messages{id,message,from,created_time}",
                "limit": limit
            }
        
        result = await self._make_request("GET", endpoint, params=params)
        return result.get("data", [])
    
    async def get_conversation_messages(
        self,
        conversation_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get messages in a conversation"""
        result = await self._make_request(
            "GET",
            f"{conversation_id}/messages",
            params={
                "fields": "id,message,from,created_time,attachments",
                "limit": limit
            }
        )
        return result.get("data", [])
    
    async def send_message(
        self,
        page_id: str,
        page_access_token: str,
        recipient_id: str,
        message: str,
        platform: str = "facebook"
    ) -> Dict[str, Any]:
        """Send a message to a user"""
        self.access_token = page_access_token
        
        endpoint = f"{page_id}/messages"
        data = {
            "recipient": {"id": recipient_id},
            "message": {"text": message}
        }
        
        if platform == "instagram":
            data["messaging_type"] = "RESPONSE"
        
        return await self._make_request("POST", endpoint, data=data)
    
    async def get_page_insights(
        self,
        page_id: str,
        page_access_token: str,
        metrics: List[str] = None,
        period: str = "day"
    ) -> Dict[str, Any]:
        """Get Facebook page insights"""
        self.access_token = page_access_token
        
        if metrics is None:
            metrics = [
                "page_impressions",
                "page_engaged_users",
                "page_post_engagements",
                "page_fans"
            ]
        
        return await self._make_request(
            "GET",
            f"{page_id}/insights",
            params={
                "metric": ",".join(metrics),
                "period": period
            }
        )
    
    async def get_page_posts_with_insights(
        self,
        page_id: str,
        page_access_token: str,
        limit: int = 25
    ) -> Dict[str, Any]:
        """Get Facebook page posts with their engagement metrics"""
        self.access_token = page_access_token
        
        # Use feed endpoint instead of posts to avoid deprecated fields error
        return await self._make_request(
            "GET",
            f"{page_id}/feed",
            params={
                "fields": "id,message,created_time,full_picture,permalink_url,shares,reactions.summary(total_count),comments.summary(total_count),attachments{type,media_type,url,media}",
                "limit": limit
            }
        )
    
    async def get_page_videos_with_views(
        self,
        page_id: str,
        page_access_token: str,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get Facebook page videos with view counts"""
        self.access_token = page_access_token
        
        return await self._make_request(
            "GET",
            f"{page_id}/videos",
            params={
                "fields": "id,title,description,created_time,thumbnails,permalink_url,views",
                "limit": limit
            }
        )
    
    async def get_page_analytics_summary(
        self,
        page_id: str,
        page_access_token: str
    ) -> Dict[str, Any]:
        """Get comprehensive analytics summary for a Facebook page"""
        self.access_token = page_access_token
        
        # Get page info with fan count
        page_info = await self._make_request(
            "GET",
            f"{page_id}",
            params={
                "fields": "id,name,fan_count,followers_count"
            }
        )
        
        # Get posts with engagement data
        try:
            posts_data = await self.get_page_posts_with_insights(page_id, page_access_token, limit=50)
            if posts_data.get('data'):
                pass
        except Exception as e:
            posts_data = {"data": []}
        
        # Get videos with view counts (with error handling)
        video_views_map = {}
        total_views = 0
        try:
            videos_data = await self.get_page_videos_with_views(page_id, page_access_token, limit=50)
            for video in videos_data.get("data", []):
                video_id = video.get("id")
                views = video.get("views", 0)
                if video_id:
                    video_views_map[video_id] = views
            total_views = sum(video_views_map.values())
        except Exception as e:
            total_views = 0
        
        total_reactions = 0
        total_comments = 0
        total_shares = 0
        
        # Weekly data (last 7 days)
        from datetime import datetime, timedelta
        weekly_data = {i: {"views": 0, "engagements": 0} for i in range(7)}
        today = datetime.now()
        
        posts = posts_data.get("data", [])
        for post in posts:
            reactions_count = post.get("reactions", {}).get("summary", {}).get("total_count", 0)
            comments_count = post.get("comments", {}).get("summary", {}).get("total_count", 0)
            shares_count = post.get("shares", {}).get("count", 0) if post.get("shares") else 0
            
            total_reactions += reactions_count
            total_comments += comments_count
            total_shares += shares_count
            
            # Parse post date for weekly breakdown
            created_time = post.get("created_time", "")
            if created_time:
                try:
                    post_date = datetime.fromisoformat(created_time.replace("Z", "+00:00").replace("+0000", "+00:00"))
                    days_ago = (today - post_date.replace(tzinfo=None)).days
                    if 0 <= days_ago < 7:
                        day_index = 6 - days_ago  # 0 = oldest, 6 = today
                        weekly_data[day_index]["engagements"] += reactions_count + comments_count
                except:
                    pass
        
        total_engagements = total_reactions + total_comments
        
        # Calculate engagement percentages
        total_engagement_actions = total_reactions + total_comments + total_shares
        reactions_pct = round((total_reactions / total_engagement_actions * 100) if total_engagement_actions > 0 else 0)
        comments_pct = round((total_comments / total_engagement_actions * 100) if total_engagement_actions > 0 else 0)
        shares_pct = round((total_shares / total_engagement_actions * 100) if total_engagement_actions > 0 else 0)
        
        # Format weekly data for chart
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        start_day = (today.weekday() + 1) % 7  # Day after today's weekday
        formatted_weekly = []
        for i in range(7):
            day_idx = (start_day + i) % 7
            formatted_weekly.append({
                "label": day_names[day_idx],
                "value": weekly_data[i]["engagements"],
                "color": "#0B3D2E" if i % 2 == 0 else "#10B981"
            })
        
        # Get top performing posts (sorted by engagement)
        top_posts = []
        for post in posts:
            reactions_count = post.get("reactions", {}).get("summary", {}).get("total_count", 0)
            comments_count = post.get("comments", {}).get("summary", {}).get("total_count", 0)
            shares_count = post.get("shares", {}).get("count", 0) if post.get("shares") else 0
            total_engagement = reactions_count + comments_count + shares_count
            
            # Determine post type from attachments or full_picture
            post_type = "text"
            attachments = post.get("attachments", {}).get("data", [])
            if attachments:
                attach_type = attachments[0].get("type", "") or attachments[0].get("media_type", "")
                if "video" in attach_type.lower():
                    post_type = "video"
                elif "photo" in attach_type.lower() or "image" in attach_type.lower():
                    post_type = "image"
                elif post.get("full_picture"):
                    post_type = "image"
            elif post.get("full_picture"):
                post_type = "image"
            
            message = post.get("message", "")
            
            # Calculate relative date
            created_time = post.get("created_time", "")
            date_str = ""
            if created_time:
                try:
                    post_date = datetime.fromisoformat(created_time.replace("Z", "+00:00").replace("+0000", "+00:00"))
                    days_ago = (today - post_date.replace(tzinfo=None)).days
                    if days_ago == 0:
                        date_str = "Today"
                    elif days_ago == 1:
                        date_str = "1d ago"
                    else:
                        date_str = f"{days_ago}d ago"
                except:
                    date_str = ""
            
            # Only include views for video posts (real views from video_views_map)
            post_id = post.get("id", "")
            # Extract video ID from post ID if it's a video post
            video_views = None
            if post_type == "video":
                # Try to find matching video views
                for vid_id, views in video_views_map.items():
                    if vid_id in post_id or post_id in vid_id:
                        video_views = views
                        break
            
            post_data = {
                "type": post_type,
                "title": message[:50] + "..." if len(message) > 50 else message if message else "No caption",
                "reacts": self._format_number(reactions_count),
                "comments": self._format_number(comments_count),
                "shares": self._format_number(shares_count),
                "date": date_str,
                "thumbnail": post.get("full_picture", None),
                "engagement": total_engagement
            }
            
            # Only add views field for video posts
            if post_type == "video" and video_views is not None:
                post_data["views"] = self._format_number(video_views)
            
            top_posts.append(post_data)
        
        # Sort by engagement and take top 5
        top_posts.sort(key=lambda x: x["engagement"], reverse=True)
        top_posts = top_posts[:5]
        # Remove the engagement key used for sorting
        for post in top_posts:
            del post["engagement"]
        
        return {
            "page_info": page_info,
            "total_views": total_views,
            "total_engagements": total_engagements,
            "total_reactions": total_reactions,
            "total_comments": total_comments,
            "total_shares": total_shares,
            "reactions_percentage": reactions_pct,
            "comments_percentage": comments_pct,
            "shares_percentage": shares_pct,
            "weekly_data": formatted_weekly,
            "posts_count": len(posts),
            "followers": page_info.get("followers_count", page_info.get("fan_count", 0)),
            "top_posts": top_posts
        }
    
    async def get_instagram_insights(
        self,
        instagram_account_id: str,
        page_access_token: str,
        metrics: List[str] = None,
        period: str = "day"
    ) -> Dict[str, Any]:
        """Get Instagram account insights"""
        self.access_token = page_access_token
        
        if metrics is None:
            metrics = [
                "impressions",
                "reach",
                "profile_views",
                "follower_count"
            ]
        
        return await self._make_request(
            "GET",
            f"{instagram_account_id}/insights",
            params={
                "metric": ",".join(metrics),
                "period": period
            }
        )
