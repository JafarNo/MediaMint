import { API_CONFIG } from '../constants/config';
//should be deleted we've handled this in enhancements.js
/**
 * Generate voice/audio from text using Amazon Polly
 * @param {string} text - Text to convert to speech
 * @param {string} voice - Voice type: "en", "en-male", "ar", "ar-male"
 * @param {string} authToken - Optional authentication token
 * @returns {Promise<Object>} Response with id, file_url (base64 audio), created_at
 */
export async function generateVoice(text, voice = "en", authToken = null) {
  const url = `${API_CONFIG.BASE_URL}/content/voices/`;


  try {
    const headers = {
      "Content-Type": "application/json"
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ text, voice })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response:", errorText);
      throw new Error(`Voice generation failed: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR inside generateVoice:", err);
    throw err;
  }
}

/**
 * Fetch all audio clips for authenticated user
 * @param {string} authToken - Authentication token
 * @returns {Promise<Array>} Array of audio content
 */
export async function fetchAllAudio(authToken) {
  const url = `${API_CONFIG.BASE_URL}/content/voices/`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch audio: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("ERROR fetching audio:", err);
    throw err;
  }
}

/**
 * Delete an audio clip
 * @param {number} audioId - ID of audio to delete
 * @param {string} authToken - Authentication token
 */
export async function deleteAudio(audioId, authToken) {
  const url = `${API_CONFIG.BASE_URL}/content/voices/${audioId}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to delete audio: ${res.status}`);
    }

    return true;

  } catch (err) {
    console.error("ERROR deleting audio:", err);
    throw err;
  }
}
