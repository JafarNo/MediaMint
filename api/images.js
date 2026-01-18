import { API_CONFIG } from '../constants/config';
import { apiClient } from './apiClient';

/**
 * Generate Instagram-optimized image using Amazon Titan Image Generator v2
 * @param {string} prompt - Description of image to generate
 * @param {string} contentType - 'post' (1:1), 'story' (9:16), or 'reel' (9:16)
 * @param {string} style - Style: professional, creative, minimal, vibrant, cinematic, natural
 * @returns {Promise<Object>} Response with id, file_url (base64 data URL), created_at
 */
export async function generateImage(prompt, contentType = 'post', style = null) {
  const url = `${API_CONFIG.BASE_URL}/content/images/`;


  try {
    const res = await apiClient.post(url, { 
      prompt,
      content_type: contentType,
      style: style
    });

    if (!res.ok) {
      let errorMessage = `Image generation failed (${res.status})`;
      
      try {
        const errorData = await res.json();
        // FastAPI returns error in 'detail' field
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch (parseErr) {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await res.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (textErr) {
          // Use default error message
        }
      }
      
      console.error(" Error response:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error(" ERROR inside generateImage:", err);
    throw err;
  }
}

/**
 * Fetch all images for authenticated user
 * @returns {Promise<Array>} Array of image content
 */
export async function fetchAllImages() {
  const url = `${API_CONFIG.BASE_URL}/content/images/`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch images: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error(" ERROR fetching images:", err);
    throw err;
  }
}

/**
 * Delete an image
 * @param {number} imageId - ID of image to delete
 */
export async function deleteImage(imageId) {
  const url = `${API_CONFIG.BASE_URL}/content/images/${imageId}`;

  try {
    const res = await apiClient.delete(url);

    if (!res.ok) {
      throw new Error(`Failed to delete image: ${res.status}`);
    }

    return true;

  } catch (err) {
    console.error(" ERROR deleting image:", err);
    throw err;
  }
}
