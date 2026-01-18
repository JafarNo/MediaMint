/**
 * Social Media Integration API
 * Handles Facebook and Instagram account connection, posting, comments, and DMs
 */

import { API_CONFIG } from '../constants/config';
import { apiClient } from './apiClient';

/**
 * Initiate Meta (Facebook/Instagram) OAuth flow
 * @returns {Promise<Object>} OAuth URL and state
 */
export async function initiateMetaOAuth() {
  const url = `${API_CONFIG.BASE_URL}/social/meta/connect`;


  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("OAuth initiation failed:", errorText);
      throw new Error(`OAuth initiation failed: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR initiating Meta OAuth:", err);
    throw err;
  }
}

/**
 * Get all connected social media accounts
 * @param {string} platform - Optional filter by platform ('facebook' or 'instagram')
 * @returns {Promise<Array>} Array of connected accounts
 */
export async function getConnectedAccounts(platform = null) {
  let url = `${API_CONFIG.BASE_URL}/social/accounts`;
  if (platform) {
    url += `?platform=${platform}`;
  }


  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      if (res.status === 401) {
        return [];
      }
      const errorText = await res.text();
      console.error("Server error:", errorText);
      throw new Error(`Failed to fetch accounts: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR fetching connected accounts:", err);
    return [];
  }
}

/**
 * Disconnect a social media account
 * @param {string} accountId - Account ID to disconnect
 * @returns {Promise<Object>} Result
 */
export async function disconnectAccount(accountId) {
  const url = `${API_CONFIG.BASE_URL}/social/accounts/${accountId}`;


  try {
    const res = await apiClient.delete(url);

    if (!res.ok) {
      throw new Error(`Failed to disconnect account: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR disconnecting account:", err);
    throw err;
  }
}

/**
 * Publish content to connected social media accounts
 * @param {Object} publishData - Publish data
 * @param {string} publishData.post_id - Internal post ID
 * @param {string[]} publishData.account_ids - Array of account IDs to publish to
 * @param {string} publishData.media_url - Public URL of media
 * @param {string} publishData.media_type - 'image', 'video', 'story', or 'reel'
 * @param {string} publishData.caption - Post caption
 * @returns {Promise<Object>} Publish results
 */
export async function publishToSocial(publishData) {
  const url = `${API_CONFIG.BASE_URL}/social/publish`;


  try {
    const res = await apiClient.post(url, publishData);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Publish failed:", errorText);
      throw new Error(`Publish failed: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR publishing to social:", err);
    throw err;
  }
}

/**
 * Get comments on a social media post
 * @param {string} accountId - Connected account ID
 * @param {string} postId - Platform post ID
 * @param {string} platform - 'facebook' or 'instagram'
 * @returns {Promise<Array>} Array of comments
 */
export async function getPostComments(accountId, postId, platform = 'facebook') {
  const url = `${API_CONFIG.BASE_URL}/social/comments/${accountId}/${postId}?platform=${platform}`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch comments: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("ERROR fetching comments:", err);
    throw err;
  }
}

/**
 * Reply to a comment
 * @param {Object} replyData - Reply data
 * @param {string} replyData.account_id - Connected account ID
 * @param {string} replyData.comment_id - Comment ID to reply to
 * @param {string} replyData.message - Reply message
 * @param {string} replyData.platform - 'facebook' or 'instagram'
 * @returns {Promise<Object>} Reply result
 */
export async function replyToComment(replyData) {
  const url = `${API_CONFIG.BASE_URL}/social/comments/reply`;


  try {
    const res = await apiClient.post(url, replyData);

    if (!res.ok) {
      throw new Error(`Failed to reply: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR replying to comment:", err);
    throw err;
  }
}

/**
 * Get conversations/DMs for an account
 * @param {string} accountId - Connected account ID
 * @param {string} platform - 'facebook' or 'instagram'
 * @returns {Promise<Array>} Array of conversations
 */
export async function getConversations(accountId, platform = 'facebook') {
  const url = `${API_CONFIG.BASE_URL}/social/messages/${accountId}?platform=${platform}`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch conversations: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("ERROR fetching conversations:", err);
    throw err;
  }
}

/**
 * Get messages in a conversation
 * @param {string} accountId - Connected account ID
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Array>} Array of messages
 */
export async function getConversationMessages(accountId, conversationId) {
  const url = `${API_CONFIG.BASE_URL}/social/messages/${accountId}/${conversationId}`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch messages: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("ERROR fetching messages:", err);
    throw err;
  }
}

/**
 * Send a DM to a user
 * @param {Object} messageData - Message data
 * @param {string} messageData.account_id - Connected account ID
 * @param {string} messageData.recipient_id - Recipient user ID
 * @param {string} messageData.message - Message text
 * @param {string} messageData.platform - 'facebook' or 'instagram'
 * @returns {Promise<Object>} Send result
 */
export async function sendMessage(messageData) {
  const url = `${API_CONFIG.BASE_URL}/social/messages/send`;


  try {
    const res = await apiClient.post(url, messageData);

    if (!res.ok) {
      throw new Error(`Failed to send message: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR sending message:", err);
    throw err;
  }
}

/**
 * Manually connect a social media account using provided tokens
 * Use this when OAuth flow doesn't work properly
 * @param {Object} accountData - Account data
 * @param {string} accountData.page_id - Facebook Page ID
 * @param {string} accountData.page_name - Facebook Page name
 * @param {string} accountData.page_access_token - Page access token
 * @param {string} accountData.instagram_account_id - Instagram Business Account ID (optional)
 * @param {string} accountData.instagram_username - Instagram username (optional)
 * @returns {Promise<Object>} Created accounts
 */
export async function manualConnectAccount(accountData) {
  const url = `${API_CONFIG.BASE_URL}/social/accounts/manual`;


  try {
    const res = await apiClient.post(url, accountData);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Manual connect failed:", errorText);
      throw new Error(`Manual connect failed: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR manually connecting account:", err);
    throw err;
  }
}

/**
 * Get insights/analytics for a connected account
 * @param {string} accountId - Connected account ID
 * @param {string} period - 'day', 'week', 'days_28', 'month', 'lifetime'
 * @returns {Promise<Object>} Insights data
 */
export async function getAccountInsights(accountId, period = 'day') {
  const url = `${API_CONFIG.BASE_URL}/social/insights/${accountId}?period=${period}`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch insights: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("ERROR fetching insights:", err);
    throw err;
  }
}

/**
 * Get comprehensive analytics summary from all connected Facebook accounts
 * @returns {Promise<Object>} Analytics summary data
 */
export async function getAnalyticsSummary() {
  const url = `${API_CONFIG.BASE_URL}/social/analytics/summary`;


  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch analytics: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR fetching analytics summary:", err);
    throw err;
  }
}

/**
 * Generate an AI response for a comment
 * @param {Object} params - Generation parameters
 * @param {string} params.comment_text - The comment to respond to
 * @param {string} params.tone - Response tone ('friendly', 'professional', 'casual', 'enthusiastic')
 * @param {string} params.custom_instructions - Optional custom instructions
 * @param {string} params.post_caption - Optional post caption for context
 * @returns {Promise<Object>} Generated response
 */
export async function generateAIResponse(params) {
  const url = `${API_CONFIG.BASE_URL}/social/comments/generate-response`;


  try {
    const res = await apiClient.post(url, params);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("AI response generation failed:", errorText);
      throw new Error(`Failed to generate response: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR generating AI response:", err);
    throw err;
  }
}

/**
 * Get autoresponder settings for a post
 * @param {string} postId - Internal post ID
 * @returns {Promise<Object>} Autoresponder settings
 */
export async function getAutoresponderSettings(postId) {
  const url = `${API_CONFIG.BASE_URL}/social/autoresponder/${postId}`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to get settings: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("ERROR getting autoresponder settings:", err);
    throw err;
  }
}

/**
 * Save autoresponder settings for a post
 * @param {string} postId - Internal post ID
 * @param {Object} settings - Autoresponder settings
 * @returns {Promise<Object>} Saved settings
 */
export async function saveAutoresponderSettings(postId, settings) {
  const url = `${API_CONFIG.BASE_URL}/social/autoresponder/${postId}`;


  try {
    const res = await apiClient.post(url, {
      post_id: postId,
      enabled: settings.enabled,
      tone: settings.tone,
      custom_instructions: settings.custom_instructions,
      response_delay_seconds: settings.response_delay_seconds || 30
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Save failed:", errorText);
      throw new Error(`Failed to save settings: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR saving autoresponder settings:", err);
    throw err;
  }
}

/**
 * Delete autoresponder settings for a post
 * @param {string} postId - Internal post ID
 * @returns {Promise<Object>} Result
 */
export async function deleteAutoresponderSettings(postId) {
  const url = `${API_CONFIG.BASE_URL}/social/autoresponder/${postId}`;

  try {
    const res = await apiClient.delete(url);

    if (!res.ok) {
      throw new Error(`Failed to delete settings: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("ERROR deleting autoresponder settings:", err);
    throw err;
  }
}

/**
 * Get comment threads (auto-responses) for a post
 * @param {string} postId - Internal post ID
 * @returns {Promise<Array>} Comment threads
 */
export async function getCommentThreads(postId) {
  const url = `${API_CONFIG.BASE_URL}/social/autoresponder/${postId}/threads`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to get threads: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("ERROR getting comment threads:", err);
    throw err;
  }
}

/**
 * Analyze sentiment of comments
 * @param {Object} params - Analysis params
 * @param {string} params.post_id - Post ID
 * @param {string[]} params.comments - List of formatted comment texts
 * @returns {Promise<Object>} Analysis result { sentiment, summary }
 */
export async function analyzeSentiment(params) {
  const url = `${API_CONFIG.BASE_URL}/social/sentiment/analyze`;

  try {
    const res = await apiClient.post(url, params);

    if (!res.ok) {
      throw new Error(`Failed to analyze sentiment: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("ERROR analyzing sentiment:", err);
    throw err;
  }
}
