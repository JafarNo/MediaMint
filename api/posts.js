import { API_CONFIG } from '../constants/config';
import { apiClient } from './apiClient';

/**
 * Create a new post with media upload to S3
 * @param {Object} postData - Post data
 * @param {string} postData.media_type - 'image', 'video', or 'story'
 * @param {string} postData.content_source - 'upload' or 'ai'
 * @param {string[]} postData.platforms - Array of platform IDs
 * @param {string} postData.caption - Post caption
 * @param {string} postData.media_url - URL of media (for AI-generated content)
 * @param {string} postData.media_base64 - Base64 encoded media (for uploads)
 * @param {string} postData.media_content_type - MIME type of media
 * @param {string} postData.prompt - AI generation prompt
 * @param {string} postData.style - AI generation style
 * @param {string} postData.status - 'published', 'scheduled', or 'draft'
 * @param {string} postData.scheduled_at - ISO datetime for scheduled posts
 * @returns {Promise<Object>} Created post data
 */
export async function createPost(postData) {
  const url = `${API_CONFIG.BASE_URL}/posts/`;


  try {
    const res = await apiClient.post(url, postData);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response:", errorText);
      throw new Error(`Post creation failed: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR inside createPost:", err);
    throw err;
  }
}

/**
 * Upload media file directly to S3 via the server
 * @param {Object} file - File object with uri, type, name
 * @param {string} mediaType - 'image' or 'video'
 * @returns {Promise<Object>} Upload result with media_url
 */
export async function uploadMedia(file, mediaType) {
  const url = `${API_CONFIG.BASE_URL}/posts/upload`;
  const token = await storage.getAccessToken();


  try {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || (mediaType === 'image' ? 'image/jpeg' : 'video/mp4'),
      name: file.name || `upload.${mediaType === 'image' ? 'jpg' : 'mp4'}`
    });
    formData.append('media_type', mediaType);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      },
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Media upload failed: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR inside uploadMedia:", err);
    throw err;
  }
}

/**
 * Get a presigned URL for direct upload to S3
 * @param {string} filename - Original filename
 * @param {string} contentType - MIME type
 * @returns {Promise<Object>} Presigned URL data
 */
export async function getPresignedUploadUrl(filename, contentType) {
  const url = `${API_CONFIG.BASE_URL}/posts/presigned-url`;

  try {
    const res = await apiClient.post(url, { filename, content_type: contentType });

    if (!res.ok) {
      throw new Error(`Failed to get presigned URL: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error(" ERROR getting presigned URL:", err);
    throw err;
  }
}

/**
 * Fetch all posts for the current user
 * @param {string} status - Optional filter by status ('published', 'scheduled', 'draft')
 * @param {number} limit - Optional limit for number of posts
 * @param {number} offset - Optional offset for pagination
 * @returns {Promise<Array>} Array of posts
 */
export async function fetchPosts(status = null, limit = null, offset = null) {
  let url = `${API_CONFIG.BASE_URL}/posts/`;
  const params = [];
  
  if (status) {
    params.push(`post_status=${status}`);
  }
  if (limit) {
    params.push(`limit=${limit}`);
  }
  if (offset) {
    params.push(`offset=${offset}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch posts: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error(" ERROR fetching posts:", err);
    throw err;
  }
}

/**
 * Fetch a specific post by ID
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Post data
 */
export async function fetchPost(postId) {
  const url = `${API_CONFIG.BASE_URL}/posts/${postId}`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch post: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error(" ERROR fetching post:", err);
    throw err;
  }
}

/**
 * Update a post
 * @param {string} postId - Post ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated post data
 */
export async function updatePost(postId, updateData) {
  const url = `${API_CONFIG.BASE_URL}/posts/${postId}`;

  try {
    const res = await apiClient.put(url, updateData);

    if (!res.ok) {
      throw new Error(`Failed to update post: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error(" ERROR updating post:", err);
    throw err;
  }
}

/**
 * Delete a post
 * @param {string} postId - Post ID
 * @returns {Promise<boolean>} Success status
 */
export async function deletePost(postId) {
  const url = `${API_CONFIG.BASE_URL}/posts/${postId}`;

  try {
    const res = await apiClient.delete(url);

    if (!res.ok) {
      throw new Error(`Failed to delete post: ${res.status}`);
    }

    return true;

  } catch (err) {
    console.error(" ERROR deleting post:", err);
    throw err;
  }
}

/**
 * Fetch scheduled posts
 * @returns {Promise<Array>} Array of scheduled posts
 */
export async function fetchScheduledPosts() {
  const url = `${API_CONFIG.BASE_URL}/posts/scheduled/upcoming`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch scheduled posts: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error(" ERROR fetching scheduled posts:", err);
    throw err;
  }
}

/**
 * Fetch draft posts
 * @returns {Promise<Array>} Array of draft posts
 */
export async function fetchDraftPosts() {
  const url = `${API_CONFIG.BASE_URL}/posts/drafts/all`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch draft posts: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error(" ERROR fetching draft posts:", err);
    throw err;
  }
}

/**
 * Fetch posts statistics overview
 * @returns {Promise<Object>} Stats object with total_posts, published, scheduled, drafts, scheduled_today
 */
export async function fetchPostsStats() {
  const url = `${API_CONFIG.BASE_URL}/posts/stats/overview`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch posts stats: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("ERROR fetching posts stats:", err);
    throw err;
  }
}

/**
 * Fetch calendar data with scheduled posts for a specific month
 * @param {number} year - Year (e.g., 2025)
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>} Calendar data with posts organized by day
 */
export async function fetchCalendarPosts(year, month) {
  const url = `${API_CONFIG.BASE_URL}/posts/calendar/${year}/${month}`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch calendar posts: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("ERROR fetching calendar posts:", err);
    throw err;
  }
}

/**
 * Convert a local file URI to base64
 * @param {string} uri - Local file URI
 * @returns {Promise<string>} Base64 encoded string
 */
export async function fileToBase64(uri) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("ERROR converting file to base64:", err);
    throw err;
  }
}
