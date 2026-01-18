import { API_CONFIG } from '../constants/config';
import { apiClient } from './apiClient';

/**
 * Generate Instagram-optimized video using OpenAI
 * WARNING: This is an async operation that takes 30-60 seconds
 * the video content is optimized via prompts for best visual results.
 * @param {string} prompt - Description of video to generate
 * @param {string} contentType - 'reel', 'story', or 'post'
 * @param {string} style - Style: professional, creative, minimal, vibrant, cinematic, natural
 * @returns {Promise<Object>} Response with id, file_url (S3 URL), created_at
 */
/**
 * Check video generation status
 */
async function checkVideoStatus(videoId) {
  const url = `${API_CONFIG.BASE_URL}/content/videos/status/${videoId}`;
  const res = await apiClient.get(url);
  if (!res.ok) {
    throw new Error(`Failed to check video status: ${res.status}`);
  }
  return await res.json();
}

/**
 * Poll for video completion
 */
async function pollVideoCompletion(videoId, maxAttempts = 60, intervalMs = 5000) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkVideoStatus(videoId);
    
    if (status.status === 'completed' && status.file_url) {
      return status;
    }
    
    if (status.status === 'failed') {
      throw new Error(status.error || 'Video generation failed');
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Video generation timed out');
}

export async function generateVideo(prompt, contentType = 'reel', style = null) {
  const url = `${API_CONFIG.BASE_URL}/content/videos/`;

  try {
    // Start video generation (returns immediately with job ID)
    const res = await apiClient.post(url, { 
      prompt,
      content_type: contentType,
      style: style
    });

    if (!res.ok) {
      let errorMessage = `Video generation failed (${res.status})`;
      
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch (parseErr) {
        try {
          const errorText = await res.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (textErr) {
          // Use default error message
        }
      }
      
      console.error("Error response:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await res.json();
    
    // If status is processing, poll for completion
    if (data.status === 'processing') {
      console.log('Video generation started, polling for completion...');
      const completed = await pollVideoCompletion(data.id);
      return {
        id: completed.id,
        file_url: completed.file_url,
        created_at: data.created_at
      };
    }
    
    return data;

  } catch (err) {
    console.error("ERROR inside generateVideo:", err);
    throw err;
  }
}

/**
 * Fetch all videos for authenticated user
 * @returns {Promise<Array>} Array of video content
 */
export async function fetchAllVideos() {
  const url = `${API_CONFIG.BASE_URL}/content/videos/`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch videos: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("ERROR fetching videos:", err);
    throw err;
  }
}

/**
 * Delete a video
 * @param {number} videoId - ID of video to delete
 */
export async function deleteVideo(videoId) {
  const url = `${API_CONFIG.BASE_URL}/content/videos/${videoId}`;

  try {
    const res = await apiClient.delete(url);

    if (!res.ok) {
      throw new Error(`Failed to delete video: ${res.status}`);
    }

    return true;

  } catch (err) {
    console.error("ERROR deleting video:", err);
    throw err;
  }
}
