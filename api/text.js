import { API_CONFIG } from '../constants/config';
import { apiClient } from './apiClient';

/**
 * Generate text content using GPT-4o-MINI WITH OPENAI
 * @param {string} prompt - Text prompt for generation
 * @returns {Promise<Object>} Response with id, prompt, result_text, created_at
 */
export async function generateText(prompt) {
  const url = `${API_CONFIG.BASE_URL}/content/text/`;


  try {
    const res = await apiClient.post(url, { prompt });

    if (!res.ok) {
      let errorMessage = `Text generation failed (${res.status})`;
      
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
      
      console.error("Error response:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR inside generateText:", err);
    throw err;
  }
}

/**
 * Fetch all text content for authenticated user
 * @returns {Promise<Array>} Array of text content
 */
export async function fetchAllTexts() {
  const url = `${API_CONFIG.BASE_URL}/content/text/`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch texts: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error(" ERROR fetching texts:", err);
    throw err;
  }
}

/**
 * Delete a text content item
 * @param {number} textId - ID of text to delete
 */
export async function deleteText(textId) {
  const url = `${API_CONFIG.BASE_URL}/content/text/${textId}`;

  try {
    const res = await apiClient.delete(url);

    if (!res.ok) {
      throw new Error(`Failed to delete text: ${res.status}`);
    }

    return true;

  } catch (err) {
    console.error(" ERROR deleting text:", err);
    throw err;
  }
}
