import { API_CONFIG } from '../constants/config';
import { apiClient } from './apiClient';

// Unified content generation API
/**
 * Generate text content using AI
 * @param {string} prompt - Text prompt for generation
 * @returns {Promise<Object>} Response with id, prompt, result_text, created_at
 */
export async function generateText(prompt) {
  const url = `${API_CONFIG.BASE_URL}/content/text/`;

  try {
    const res = await apiClient.post(url, { prompt });

    if (!res.ok) {
      throw new Error(`Text generation failed: ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      data: {
        id: data.id,
        type: 'text',
        prompt: data.prompt,
        content: data.result_text,
        createdAt: data.created_at
      }
    };

  } catch (err) {
    console.error(" ERROR generating text:", err);
    return {
      success: false,
      error: err.message || 'Text generation failed'
    };
  }
}

/**
 * Generate image using AI
 * @param {string} prompt - Description of image to generate
 * @returns {Promise<Object>} Response with id, file_url (base64 data URL), created_at
 */
export async function generateImage(prompt) {
  const url = `${API_CONFIG.BASE_URL}/content/images?prompt=${encodeURIComponent(prompt)}`;

  try {
    const res = await apiClient.post(url, {});

    if (!res.ok) {
      throw new Error(`Image generation failed: ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      data: {
        id: data.id,
        type: 'image',
        fileUrl: data.file_url,
        createdAt: data.created_at
      }
    };

  } catch (err) {
    console.error(" ERROR generating image:", err);
    return {
      success: false,
      error: err.message || 'Image generation failed'
    };
  }
}

/**
 * Generate video using AI
 * WARNING: This is an async operation that takes 30-60 seconds
 * @param {string} prompt - Description of video to generate
 * @returns {Promise<Object>} Response with id, file_url (S3 URL), created_at
 */
export async function generateVideo(prompt) {
  const url = `${API_CONFIG.BASE_URL}/content/videos?prompt=${encodeURIComponent(prompt)}`;


  try {
    const res = await apiClient.post(url, {});

    if (!res.ok) {
      throw new Error(`Video generation failed: ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      data: {
        id: data.id,
        type: 'video',
        fileUrl: data.file_url,
        createdAt: data.created_at
      }
    };

  } catch (err) {
    console.error(" ERROR generating video:", err);
    return {
      success: false,
      error: err.message || 'Video generation failed'
    };
  }
}

/**
 * Fetch all content for authenticated user
 * @param {string} type - Content type: 'text', 'image', or 'video'
 * @returns {Promise<Object>} Array of content items
 */
export async function fetchAllContent(type) {
  const endpoints = {
    text: '/content/text/',
    image: '/content/images/',
    video: '/content/videos/'
  };

  const url = `${API_CONFIG.BASE_URL}${endpoints[type]}`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch ${type} content: ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      data
    };

  } catch (err) {
    console.error(` ERROR fetching ${type} content:`, err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Delete content by ID
 * @param {string} type - Content type: 'text', 'image', or 'video'
 * @param {string} contentId - ID of content to delete
 * @returns {Promise<Object>} Success status
 */
export async function deleteContent(type, contentId) {
  const endpoints = {
    text: '/content/text/',
    image: '/content/images/',
    video: '/content/videos/'
  };

  const url = `${API_CONFIG.BASE_URL}${endpoints[type]}${contentId}`;

  try {
    const res = await apiClient.delete(url);

    if (!res.ok) {
      throw new Error(`Failed to delete ${type}: ${res.status}`);
    }

    return { success: true };

  } catch (err) {
    console.error(` ERROR deleting ${type}:`, err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Generate content based on type
 * @param {string} type - Content type: 'text', 'image', 'video', or 'story'
 * @param {string} prompt - Generation prompt
 * @returns {Promise<Object>} Generated content
 */
export async function generateContent(type, prompt) {
  switch (type) { 
    case 'text':
    case 'story':
      return generateText(prompt);
    case 'image':
      return generateImage(prompt);
    case 'video':
      return generateVideo(prompt);
    default:
      return {
        success: false,
        error: `Unknown content type: ${type}`
      };
  }
}
