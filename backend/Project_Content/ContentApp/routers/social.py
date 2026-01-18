from typing import Annotated, Optional, List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from pydantic import BaseModel
import secrets
import json

from .auth import get_current_user
from ..firebase_config import db, COLLECTIONS, generate_id
from ..firebase_db import (
    LinkedAccountDB, 
    AutoresponderSettingsDB, 
    CommentThreadDB, 
    SocialAccountDB, 
    OAuthStateDB,
    PublishedPostDB
)
from ..services.meta_service import MetaService, MetaAPIError
from ..config import META_APP_ID, META_REDIRECT_URI

router = APIRouter(
    prefix='/social',
    tags=['social']
)

user_dependency = Annotated[dict, Depends(get_current_user)]

class ConnectAccountRequest(BaseModel):
    platform: str  # 'facebook' or 'instagram'
    redirect_url: Optional[str] = None  # Where to redirect after OAuth


class DisconnectAccountRequest(BaseModel):
    account_id: str


class PublishPostRequest(BaseModel):
    post_id: str  # Internal post ID
    account_ids: List[str]  # List of connected account IDs to publish to
    caption: Optional[str] = None  # Override caption
    media_url: str  # Public URL of media
    media_type: str  # 'image', 'video', 'story', 'reel'


class ReplyToCommentRequest(BaseModel):
    account_id: str
    comment_id: str
    message: str
    platform: str  # 'facebook' or 'instagram'


class AnalyzeSentimentRequest(BaseModel):
    post_id: str
    comments: List[str]


# Import text generation service
from ..services.btext import generate_text



class SendMessageRequest(BaseModel):
    account_id: str
    recipient_id: str
    message: str
    platform: str  # 'facebook' or 'instagram'


class GenerateAIResponseRequest(BaseModel):
    comment_text: str
    tone: str  # 'friendly', 'professional', 'casual', 'enthusiastic'
    custom_instructions: Optional[str] = None
    post_caption: Optional[str] = None


class PostAutoresponderSettings(BaseModel):
    post_id: str
    enabled: bool = True
    tone: str = 'friendly'  # 'friendly', 'professional', 'casual', 'enthusiastic'
    custom_instructions: Optional[str] = None
    response_delay_seconds: int = 30  # Delay before responding






@router.get("/meta/connect", status_code=status.HTTP_200_OK)
async def initiate_meta_oauth(user: user_dependency):
    """
    Initiate OAuth flow for Meta (Facebook/Instagram)
    Returns the OAuth URL to redirect the user to
    """
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    if not META_APP_ID:
        raise HTTPException(status_code=500, detail='Meta App not configured')
    
    
    # Create OAuth state
    state = OAuthStateDB.create(user['id'], 'meta')
    
    # Generate OAuth URL
    oauth_url = MetaService.get_oauth_url(state)
    
    
    return {
        "oauth_url": oauth_url,
        "state": state,
        "message": "Redirect user to oauth_url to connect their Facebook/Instagram accounts"
    }


@router.get("/meta/callback")
async def meta_oauth_callback(
    code: str = Query(...),
    state: str = Query(...)
):
    """
    OAuth callback endpoint for Meta
    This is called by Meta after user authorizes the app
    """
    
    # Validate state
    state_data = OAuthStateDB.get_and_validate(state)
    if not state_data:
        return HTMLResponse(
            content="""
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>Connection Failed</h1>
                    <p>Invalid or expired authorization. This may happen if you refreshed the page.</p>
                    <p>Please close this window and try connecting again from the app.</p>
                    <script>
                        setTimeout(() => window.close(), 5000);
                    </script>
                </body>
            </html>
            """,
            status_code=400
        )
    
    user_id = state_data['user_id']
    
    try:
        # Exchange code for access token
        token_result = await MetaService.exchange_code_for_token(code)
        short_lived_token = token_result.get('access_token')
        
        # Get long-lived token
        long_lived_result = await MetaService.get_long_lived_token(short_lived_token)
        access_token = long_lived_result.get('access_token')
        expires_in = long_lived_result.get('expires_in', 5184000)  # Default 60 days
        
        # Initialize Meta service
        meta_service = MetaService(access_token)
        
        # Get user info
        user_info = await meta_service.get_user_info()
        fb_user_id = user_info.get('id')
        fb_user_name = user_info.get('name')
        
        # Get pages the user manages
        pages = await meta_service.get_pages()
        if not pages:
            pass
        else:
            for p in pages:
                ig_biz = p.get('instagram_business_account')
        
        connected_accounts = []
        
        for page in pages:
            page_id = page.get('id')
            page_name = page.get('name')
            page_access_token = page.get('access_token')
            
            # Check if already connected
            existing = SocialAccountDB.get_by_page_id(page_id)
            if existing and existing.get('userID') != user_id:
                continue  # Page connected to different user
            
            # Get Instagram business account if available
            instagram_account = page.get('instagram_business_account')
            instagram_id = None
            instagram_username = None
            
            if instagram_account:
                instagram_id = instagram_account.get('id')
                # Get more Instagram details
                try:
                    ig_details = await meta_service.get_instagram_account(page_id, page_access_token)
                    if ig_details:
                        instagram_username = ig_details.get('username')
                except:
                    pass
            
            # Create or update account
            if existing:
                SocialAccountDB.update(existing['accountID'], {
                    'accessToken': access_token,
                    'page_access_token': page_access_token,
                    'token_expires_at': datetime.now(timezone.utc) + timedelta(seconds=expires_in),
                    'instagram_account_id': instagram_id,
                    'instagram_username': instagram_username
                })
                connected_accounts.append({
                    'account_id': existing['accountID'],
                    'page_name': page_name,
                    'instagram_username': instagram_username,
                    'updated': True
                })
            else:
                # Create new account - one for Facebook page
                fb_account = SocialAccountDB.create({
                    'userID': user_id,
                    'platform': 'facebook',
                    'username': page_name,
                    'accessToken': access_token,
                    'token_expires_at': datetime.now(timezone.utc) + timedelta(seconds=expires_in),
                    'pageID': page_id,
                    'page_name': page_name,
                    'page_access_token': page_access_token,
                    'instagram_account_id': instagram_id,
                    'instagram_username': instagram_username,
                    'fb_user_id': fb_user_id
                })
                connected_accounts.append({
                    'account_id': fb_account['accountID'],
                    'page_name': page_name,
                    'instagram_username': instagram_username,
                    'created': True
                })
                
                # If Instagram is connected, create separate Instagram account entry
                if instagram_id and instagram_username:
                    ig_account = SocialAccountDB.create({
                        'userID': user_id,
                        'platform': 'instagram',
                        'username': instagram_username,
                        'accessToken': access_token,
                        'token_expires_at': datetime.now(timezone.utc) + timedelta(seconds=expires_in),
                        'pageID': page_id,
                        'page_name': page_name,
                        'page_access_token': page_access_token,
                        'instagram_account_id': instagram_id,
                        'instagram_username': instagram_username,
                        'fb_user_id': fb_user_id
                    })
                    connected_accounts.append({
                        'account_id': ig_account['accountID'],
                        'platform': 'instagram',
                        'instagram_username': instagram_username,
                        'created': True
                    })
        
        await meta_service.close()
        
        # Return success page
        accounts_json = json.dumps(connected_accounts)
        return HTMLResponse(
            content=f"""
            <html>
                <head>
                    <style>
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: linear-gradient(135deg, #0B3D2E 0%, #145A32 100%);
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0;
                        }}
                        .card {{
                            background: white;
                            border-radius: 20px;
                            padding: 40px;
                            text-align: center;
                            max-width: 400px;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        }}
                        .success-icon {{
                            font-size: 60px;
                            margin-bottom: 20px;
                        }}
                        h1 {{
                            color: #0B3D2E;
                            margin-bottom: 10px;
                        }}
                        p {{
                            color: #666;
                            line-height: 1.6;
                        }}
                        .accounts {{
                            background: #f5f5f5;
                            border-radius: 10px;
                            padding: 15px;
                            margin: 20px 0;
                            text-align: left;
                        }}
                        .account {{
                            padding: 8px 0;
                            border-bottom: 1px solid #ddd;
                        }}
                        .account:last-child {{
                            border-bottom: none;
                        }}
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="success-icon">✅</div>
                        <h1>Connected Successfully!</h1>
                        <p>Your Facebook and Instagram accounts have been connected to MediaMint.</p>
                        <div class="accounts">
                            <strong>Connected Accounts:</strong>
                            {''.join([f'<div class="account">📱 {acc.get("page_name", acc.get("instagram_username", "Account"))}</div>' for acc in connected_accounts]) if connected_accounts else '<div class="account">No new accounts connected</div>'}
                        </div>
                        <p style="font-size: 14px; color: #999;">You can close this window and return to the app.</p>
                    </div>
                    <script>
                        // Post message to parent window if in iframe/popup
                        if (window.opener) {{
                            window.opener.postMessage({{
                                type: 'META_OAUTH_SUCCESS',
                                accounts: {accounts_json}
                            }}, '*');
                            setTimeout(() => window.close(), 2000);
                        }}
                    </script>
                </body>
            </html>
            """,
            status_code=200
        )
        
    except MetaAPIError as e:
        return HTMLResponse(
            content=f"""
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>Connection Failed</h1>
                    <p>Error: {e.message}</p>
                    <p>Please try again or contact support.</p>
                </body>
            </html>
            """,
            status_code=400
        )
    except Exception as e:
        return HTMLResponse(
            content=f"""
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>Connection Failed</h1>
                    <p>An unexpected error occurred. Please try again.</p>
                </body>
            </html>
            """,
            status_code=500
        )



@router.get("/accounts", status_code=status.HTTP_200_OK)
async def get_connected_accounts(
    user: user_dependency,
    platform: Optional[str] = None
):
    """Get all connected social media accounts for the current user"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    accounts = SocialAccountDB.get_by_user(user['id'], platform)
    safe_accounts = []
    if accounts:
    
        # Remove sensitive data from response
        for acc in accounts:
            safe_accounts.append({
                'account_id': acc.get('accountID'),
                'platform': acc.get('platform'),
                'username': acc.get('username'),
                'page_name': acc.get('page_name'),
                'instagram_username': acc.get('instagram_username'),
                'profile_picture_url': acc.get('profile_picture_url'),
                'is_active': acc.get('is_active', True),
                'created_at': str(acc.get('created_at')) if acc.get('created_at') else None
            })
    
    return safe_accounts


class ManualConnectRequest(BaseModel):
    """Request to manually connect an account with tokens"""
    page_id: str
    page_name: str
    page_access_token: str
    instagram_account_id: Optional[str] = None
    instagram_username: Optional[str] = None


@router.post("/accounts/manual", status_code=status.HTTP_201_CREATED)
async def manual_connect_account(request: ManualConnectRequest, user: user_dependency):
    """
    Manually connect a social media account using provided tokens.
    Use this when OAuth flow doesn't work properly.
    """
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    from datetime import timedelta
    
    # Check if page already connected
    existing = SocialAccountDB.get_by_page_id(request.page_id)
    if existing:
        if existing.get('userID') == user['id']:
            # Update existing
            SocialAccountDB.update(existing['accountID'], {
                'page_access_token': request.page_access_token,
                'instagram_account_id': request.instagram_account_id,
                'instagram_username': request.instagram_username,
                'token_expires_at': datetime.now(timezone.utc) + timedelta(days=60)
            })
            return {"message": "Account updated successfully", "account_id": existing['accountID']}
        else:
            raise HTTPException(status_code=400, detail='Page already connected to another user')
    
    # Create Facebook account
    fb_account = SocialAccountDB.create({
        'userID': user['id'],
        'platform': 'facebook',
        'username': request.page_name,
        'accessToken': request.page_access_token,
        'token_expires_at': datetime.now(timezone.utc) + timedelta(days=60),
        'pageID': request.page_id,
        'page_name': request.page_name,
        'page_access_token': request.page_access_token,
        'instagram_account_id': request.instagram_account_id,
        'instagram_username': request.instagram_username
    })
    
    created_accounts = [{'account_id': fb_account['accountID'], 'platform': 'facebook', 'name': request.page_name}]
    
    # Create Instagram account if provided
    if request.instagram_account_id and request.instagram_username:
        ig_account = SocialAccountDB.create({
            'userID': user['id'],
            'platform': 'instagram',
            'username': request.instagram_username,
            'accessToken': request.page_access_token,
            'token_expires_at': datetime.now(timezone.utc) + timedelta(days=60),
            'pageID': request.page_id,
            'page_name': request.page_name,
            'page_access_token': request.page_access_token,
            'instagram_account_id': request.instagram_account_id,
            'instagram_username': request.instagram_username
        })
        created_accounts.append({'account_id': ig_account['accountID'], 'platform': 'instagram', 'name': request.instagram_username})
    
    return {
        "message": "Accounts connected successfully",
        "accounts": created_accounts
    }


@router.delete("/accounts/{account_id}", status_code=status.HTTP_200_OK)
async def disconnect_account(user: user_dependency, account_id: str):
    """Disconnect a social media account"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    account = SocialAccountDB.get_by_id(account_id)
    
    if not account or account.get('userID') != user['id']:
        raise HTTPException(status_code=404, detail='Account not found')
    
    success = SocialAccountDB.delete(account_id)
    
    if not success:
        raise HTTPException(status_code=500, detail='Failed to disconnect account')
    
    return {"message": "Account disconnected successfully"}



@router.post("/publish", status_code=status.HTTP_201_CREATED)
async def publish_to_social(request: PublishPostRequest, user: user_dependency):
    """
    Publish content to connected social media accounts
    """
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    results = []
    
    for account_id in request.account_ids:
        account = SocialAccountDB.get_by_id(account_id)
        
        if not account or account.get('userID') != user['id']:
            results.append({
                'account_id': account_id,
                'success': False,
                'error': 'Account not found or unauthorized'
            })
            continue
        
        if not account.get('is_active'):
            results.append({
                'account_id': account_id,
                'success': False,
                'error': 'Account is not active'
            })
            continue
        
        try:
            meta_service = MetaService(account.get('page_access_token'))
            platform = account.get('platform')
            platform_post_id = None
            
            if platform == 'facebook':
                # Publish to Facebook
                if request.media_type == 'reel':
                    result = await meta_service.post_facebook_reel(
                        account.get('pageID'),
                        account.get('page_access_token'),
                        request.media_url,
                        request.caption or ''
                    )
                else:
                    media_type = 'video' if request.media_type == 'video' else 'photo'
                    result = await meta_service.post_to_facebook_page(
                        account.get('pageID'),
                        account.get('page_access_token'),
                        request.caption or '',
                        media_url=request.media_url,
                        media_type=media_type
                    )
                platform_post_id = result.get('id') or result.get('post_id')
                
            elif platform == 'instagram':
                instagram_id = account.get('instagram_account_id')
                if not instagram_id:
                    raise MetaAPIError('Instagram account not connected to this page')
                
                if request.media_type == 'reel':
                    result = await meta_service.post_instagram_reel(
                        instagram_id,
                        account.get('page_access_token'),
                        request.media_url,
                        request.caption or ''
                    )
                else:
                    media_type = 'VIDEO' if request.media_type == 'video' else 'IMAGE'
                    result = await meta_service.post_to_instagram(
                        instagram_id,
                        account.get('page_access_token'),
                        request.media_url,
                        request.caption or '',
                        media_type
                    )
                platform_post_id = result.get('id')
            
            await meta_service.close()
            
            # Record the published post
            PublishedPostDB.create({
                'internal_post_id': request.post_id,
                'user_id': user['id'],
                'account_id': account_id,
                'platform': platform,
                'platform_post_id': platform_post_id,
                'media_type': request.media_type,
                'status': 'published'
            })
            
            results.append({
                'account_id': account_id,
                'platform': platform,
                'success': True,
                'platform_post_id': platform_post_id
            })
            
        except MetaAPIError as e:
            # Record failed attempt
            PublishedPostDB.create({
                'internal_post_id': request.post_id,
                'user_id': user['id'],
                'account_id': account_id,
                'platform': account.get('platform'),
                'media_type': request.media_type,
                'status': 'failed',
                'error_message': e.message
            })
            
            results.append({
                'account_id': account_id,
                'platform': account.get('platform'),
                'success': False,
                'error': e.message
            })
        except Exception as e:
            results.append({
                'account_id': account_id,
                'success': False,
                'error': str(e)
            })
    
    # Check overall success
    successful = [r for r in results if r.get('success')]
    failed = [r for r in results if not r.get('success')]
    
    return {
        'total': len(results),
        'successful': len(successful),
        'failed': len(failed),
        'results': results
    }



@router.get("/comments/{account_id}/{post_id}", status_code=status.HTTP_200_OK)
async def get_post_comments(
    user: user_dependency,
    account_id: str,
    post_id: str,
    platform: str = Query(default='facebook')
):
    """Get comments on a social media post"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    account = SocialAccountDB.get_by_id(account_id)
    
    if not account or account.get('userID') != user['id']:
        raise HTTPException(status_code=404, detail='Account not found')
    
    try:
        meta_service = MetaService(account.get('page_access_token'))
        
        if platform == 'instagram':
            comments = await meta_service.get_instagram_media_comments(post_id)
        else:
            comments = await meta_service.get_post_comments(post_id)
        
        await meta_service.close()
        
        return comments
        
    except MetaAPIError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.post("/comments/reply", status_code=status.HTTP_201_CREATED)
async def reply_to_comment(request: ReplyToCommentRequest, user: user_dependency):
    """Reply to a comment on a social media post"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    account = SocialAccountDB.get_by_id(request.account_id)
    
    if not account or account.get('userID') != user['id']:
        raise HTTPException(status_code=404, detail='Account not found')
    
    try:
        meta_service = MetaService(account.get('page_access_token'))
        
        if request.platform == 'instagram':
            result = await meta_service.reply_to_instagram_comment(
                request.comment_id,
                request.message
            )
        else:
            result = await meta_service.reply_to_comment(
                request.comment_id,
                request.message
            )
        
        await meta_service.close()
        
        return {
            'success': True,
            'reply_id': result.get('id'),
            'message': 'Reply posted successfully'
        }
        
    except MetaAPIError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.post("/comments/generate-response", status_code=status.HTTP_200_OK)
async def generate_ai_response(request: GenerateAIResponseRequest, user: user_dependency):
    """Generate an AI response for a comment"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    from ..services.btext import generate_text
    
    # Build the prompt based on tone and instructions
    tone_descriptions = {
        'friendly': 'warm, approachable, and personable with emojis',
        'professional': 'formal, business-like, and polished',
        'casual': 'relaxed, informal, and conversational',
        'enthusiastic': 'excited, energetic, and positive with emojis'
    }
    
    tone_desc = tone_descriptions.get(request.tone, tone_descriptions['friendly'])
    
    prompt = f"""Generate a {tone_desc} response to this social media comment.

Comment: "{request.comment_text}"
"""
    
    if request.post_caption:
        prompt += f"\nContext (original post caption): \"{request.post_caption}\"\n"
    
    if request.custom_instructions:
        prompt += f"\nAdditional instructions: {request.custom_instructions}\n"
    
    prompt += """
Keep the response concise (under 100 words), natural, and engaging.
Only output the response text, nothing else."""

    try:
        response = generate_text(prompt)
        
        return {
            'success': True,
            'response': response.strip(),
            'tone': request.tone
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to generate response: {str(e)}')



@router.get("/autoresponder/{post_id}", status_code=status.HTTP_200_OK)
async def get_autoresponder_settings(user: user_dependency, post_id: str):
    """Get autoresponder settings for a post"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    settings = AutoresponderSettingsDB.get_by_post(post_id)
    
    if settings and settings.get('user_id') != user['id']:
        raise HTTPException(status_code=403, detail='Not authorized')
    
    return settings or {
        'post_id': post_id,
        'enabled': False,
        'tone': 'friendly',
        'custom_instructions': None,
        'response_delay_seconds': 30
    }


@router.post("/autoresponder/{post_id}", status_code=status.HTTP_200_OK)
async def save_autoresponder_settings(
    user: user_dependency,
    post_id: str,
    request: PostAutoresponderSettings
):
    """Save autoresponder settings for a post"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    # Get the post to verify ownership and get social_post_ids
    from .posts import PostDB
    post = PostDB.get_by_id(post_id)
    
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    
    if post.get('user_id') != user['id']:
        raise HTTPException(status_code=403, detail='Not authorized')
    
    # Save settings with social_post_ids from the post
    settings = {
        'enabled': request.enabled,
        'tone': request.tone,
        'custom_instructions': request.custom_instructions,
        'response_delay_seconds': request.response_delay_seconds,
        'social_post_ids': post.get('social_post_ids', {}),
        'post_caption': post.get('caption', '')
    }
    
    saved = AutoresponderSettingsDB.save(post_id, user['id'], settings)
    
    return {
        'success': True,
        'settings': saved
    }


@router.delete("/autoresponder/{post_id}", status_code=status.HTTP_200_OK)
async def delete_autoresponder_settings(user: user_dependency, post_id: str):
    """Delete autoresponder settings for a post"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    settings = AutoresponderSettingsDB.get_by_post(post_id)
    
    if settings and settings.get('user_id') != user['id']:
        raise HTTPException(status_code=403, detail='Not authorized')
    
    AutoresponderSettingsDB.delete(post_id)
    
    return {'success': True}


@router.get("/autoresponder/{post_id}/threads", status_code=status.HTTP_200_OK)
async def get_comment_threads(user: user_dependency, post_id: str):
    """Get all auto-response threads for a post"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    threads = CommentThreadDB.get_by_post(post_id)
    
    # Filter to only user's threads
    user_threads = [t for t in threads if t.get('user_id') == user['id']]
    
    return user_threads



@router.get("/messages/{account_id}", status_code=status.HTTP_200_OK)
async def get_conversations(
    user: user_dependency,
    account_id: str,
    platform: str = Query(default='facebook')
):
    """Get conversations/DMs for an account"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    account = SocialAccountDB.get_by_id(account_id)
    
    if not account or account.get('userID') != user['id']:
        raise HTTPException(status_code=404, detail='Account not found')
    
    try:
        meta_service = MetaService(account.get('page_access_token'))
        
        conversations = await meta_service.get_conversations(
            account.get('pageID'),
            account.get('page_access_token'),
            platform
        )
        
        await meta_service.close()
        
        return conversations
        
    except MetaAPIError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.get("/messages/{account_id}/{conversation_id}", status_code=status.HTTP_200_OK)
async def get_conversation_messages(
    user: user_dependency,
    account_id: str,
    conversation_id: str
):
    """Get messages in a specific conversation"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    account = SocialAccountDB.get_by_id(account_id)
    
    if not account or account.get('userID') != user['id']:
        raise HTTPException(status_code=404, detail='Account not found')
    
    try:
        meta_service = MetaService(account.get('page_access_token'))
        
        messages = await meta_service.get_conversation_messages(conversation_id)
        
        await meta_service.close()
        
        return messages
        
    except MetaAPIError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.post("/messages/send", status_code=status.HTTP_201_CREATED)
async def send_message(request: SendMessageRequest, user: user_dependency):
    """Send a DM to a user"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    account = SocialAccountDB.get_by_id(request.account_id)
    
    if not account or account.get('userID') != user['id']:
        raise HTTPException(status_code=404, detail='Account not found')
    
    try:
        meta_service = MetaService(account.get('page_access_token'))
        
        result = await meta_service.send_message(
            account.get('pageID'),
            account.get('page_access_token'),
            request.recipient_id,
            request.message,
            request.platform
        )
        
        await meta_service.close()
        
        return {
            'success': True,
            'message_id': result.get('message_id'),
            'message': 'Message sent successfully'
        }
        
    except MetaAPIError as e:
        raise HTTPException(status_code=400, detail=e.message)



class ManualConnectRequest(BaseModel):
    """Request to manually connect an Instagram account with existing credentials"""
    page_id: str
    page_name: str
    instagram_account_id: str
    instagram_username: str
    access_token: str  # Long-lived token


@router.post("/connect/manual", status_code=status.HTTP_201_CREATED)
async def manual_connect_instagram(
    user: user_dependency,
    request: ManualConnectRequest
):
    """
    Manually connect an Instagram Business account using existing credentials.
    Use this when you already have the Page ID, Instagram BID, and long-lived token.
    """
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    try:
        # Check if account already exists
        existing = SocialAccountDB.get_by_page_id(request.page_id)
        if existing:
            raise HTTPException(
                status_code=400, 
                detail='This page is already connected'
            )
        
        # Calculate token expiry (60 days for long-lived tokens)
        token_expires_at = datetime.now(timezone.utc) + timedelta(days=60)
        
        # Create the linked account
        account_data = {
            'userID': user['id'],
            'platform': 'instagram',
            'username': request.instagram_username,
            'profile_picture_url': None,
            'accessToken': request.access_token,
            'token_expires_at': token_expires_at,
            'pageID': request.page_id,
            'page_name': request.page_name,
            'page_access_token': request.access_token,
            'instagram_account_id': request.instagram_account_id,
            'instagram_username': request.instagram_username,
            'fb_user_id': None,
            'scopes': ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement']
        }
        
        account = SocialAccountDB.create(account_data)
        
        
        return {
            "success": True,
            "message": f"Successfully connected Instagram account @{request.instagram_username}",
            "account": {
                "id": account.get('accountID'),
                "platform": "instagram",
                "username": request.instagram_username,
                "page_name": request.page_name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/{account_id}", status_code=status.HTTP_200_OK)
async def get_account_insights(
    user: user_dependency,
    account_id: str,
    period: str = Query(default='day')
):
    """Get insights/analytics for a connected account"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    account = SocialAccountDB.get_by_id(account_id)
    
    if not account or account.get('userID') != user['id']:
        raise HTTPException(status_code=404, detail='Account not found')
    
    try:
        meta_service = MetaService(account.get('page_access_token'))
        platform = account.get('platform')
        
        if platform == 'instagram' and account.get('instagram_account_id'):
            insights = await meta_service.get_instagram_insights(
                account.get('instagram_account_id'),
                account.get('page_access_token'),
                period=period
            )
        else:
            insights = await meta_service.get_page_insights(
                account.get('pageID'),
                account.get('page_access_token'),
                period=period
            )
        
        await meta_service.close()
        
        return insights
        
    except MetaAPIError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.get("/analytics/summary", status_code=status.HTTP_200_OK)
async def get_analytics_summary(user: user_dependency):
    """Get comprehensive analytics summary from all connected Facebook accounts"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    try:
        # Get all Facebook accounts for the user
        accounts = SocialAccountDB.get_by_user(user['id'])
        facebook_accounts = [acc for acc in accounts if acc.get('platform') == 'facebook']
        
        if not facebook_accounts:
            return {
                "total_views": 0,
                "total_engagements": 0,
                "total_reactions": 0,
                "total_comments": 0,
                "total_shares": 0,
                "reactions_percentage": 0,
                "comments_percentage": 0,
                "shares_percentage": 0,
                "weekly_data": [],
                "posts_count": 0,
                "followers": 0,
                "accounts_count": 0
            }
        
        # Aggregate data from all Facebook accounts
        total_views = 0
        total_engagements = 0
        total_reactions = 0
        total_comments = 0
        total_shares = 0
        total_followers = 0
        total_posts = 0
        all_weekly_data = {}
        all_top_posts = []
        
        for account in facebook_accounts:
            try:
                page_id = account.get('pageID')
                page_token = account.get('page_access_token')
                meta_service = MetaService(account.get('page_access_token'))
                summary = await meta_service.get_page_analytics_summary(
                    account.get('pageID'),
                    account.get('page_access_token')
                )
                await meta_service.close()
                
                
                total_views += summary.get('total_views', 0)
                total_engagements += summary.get('total_engagements', 0)
                total_reactions += summary.get('total_reactions', 0)
                total_comments += summary.get('total_comments', 0)
                total_shares += summary.get('total_shares', 0)
                total_followers += summary.get('followers', 0)
                total_posts += summary.get('posts_count', 0)
                
                # Aggregate weekly data
                for day_data in summary.get('weekly_data', []):
                    label = day_data.get('label')
                    if label not in all_weekly_data:
                        all_weekly_data[label] = {"label": label, "value": 0, "color": day_data.get('color', '#0B3D2E')}
                    all_weekly_data[label]["value"] += day_data.get('value', 0)
                
                # Collect top posts
                all_top_posts.extend(summary.get('top_posts', []))
                    
            except Exception as e:
                import traceback
                traceback.print_exc()
                continue
        
        # Calculate percentages
        total_engagement_actions = total_reactions + total_comments + total_shares
        reactions_pct = round((total_reactions / total_engagement_actions * 100) if total_engagement_actions > 0 else 0)
        comments_pct = round((total_comments / total_engagement_actions * 100) if total_engagement_actions > 0 else 0)
        shares_pct = round((total_shares / total_engagement_actions * 100) if total_engagement_actions > 0 else 0)
        
        # Format weekly data
        day_order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        weekly_data = [all_weekly_data.get(day, {"label": day, "value": 0, "color": "#0B3D2E"}) for day in day_order]
        
        
        return {
            "total_views": total_views,
            "total_engagements": total_engagements,
            "total_reactions": total_reactions,
            "total_comments": total_comments,
            "total_shares": total_shares,
            "reactions_percentage": reactions_pct,
            "comments_percentage": comments_pct,
            "shares_percentage": shares_pct,
            "weekly_data": weekly_data,
            "posts_count": total_posts,
            "followers": total_followers,
            "accounts_count": len(facebook_accounts),
            "top_posts": all_top_posts[:5]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/sentiment/analyze')
async def analyze_sentiment(
    request: AnalyzeSentimentRequest,
    user: user_dependency
):
    """
    Analyze the sentiment of a list of comments using AI.
    Returns a summary and overall sentiment (positive/negative/neutral).
    """
    if not request.comments:
        return {
            "summary": "No comments to analyze.",
            "sentiment": "neutral"
        }

    try:
        # Construct prompt for the LLM
        comments_text = "\n".join([f"- {c}" for c in request.comments if c])
        
        prompt = f"""
        Analyze the sentiment of the following comments for a social media post. 
        Determine the overall sentiment (Positive, Negative, or Neutral) and provide a brief implementation summary (2-3 sentences) of what the users are saying or feeling.

        Comments:
        {comments_text}

        Output format (JSON):
        {{
            "sentiment": "Positive/Negative/Neutral",
            "summary": "Your summary here"
        }}
        """

        # Call AI Service (using generate_text which uses OpenAI
        response_text = generate_text(prompt)
        
        # Parse result (simple attempt to extract JSON if wrapped in code blocks)
        try:
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(0))
            else:
                # Fallback if valid JSON isn't returned
                result = {
                    "sentiment": "Neutral",
                    "summary": response_text.strip()
                }
        except Exception:
             result = {
                "sentiment": "Neutral",
                "summary": response_text.strip()
            }

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sentiment analysis failed: {str(e)}"
        )
