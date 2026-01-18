import { API_CONFIG } from '../constants/config';
import { apiClient } from './apiClient';

/**
 * Generate auto captions for a video stored in S3 using AWS Transcribe
 * @param {string} videoKey - S3 key of the video (e.g., "videos/my-video.mp4")
 * @returns {Promise<Object>} Response with message and file_url of captioned video
 */
export async function addCaptionsToVideo(videoKey) {
  const url = `${API_CONFIG.BASE_URL}/captions/add-captions?video_key=${encodeURIComponent(videoKey)}`;
//still needs to be connected to the UI 

  try {
    const res = await apiClient.post(url, {});

    if (!res.ok) {
      const errorText = await res.text();
      console.error(" Error response:", errorText);
      throw new Error(`Caption generation failed: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error(" ERROR inside addCaptionsToVideo:", err);
    throw err;
  }
}
