import { API_CONFIG } from '../constants/config';
// should be deleted because its already handled in enhancements.js
/**
 * Add background music to a video stored in S3
 * @param {string} videoKey - S3 key of the video (e.g., "videos/my-video.mp4")
 * @param {string} musicKey - S3 key of the music file (e.g., "music/background.mp3")
 * @param {string} authToken - Authentication token (required)
 * @returns {Promise<Object>} Response with message and file_url
 */
export async function addMusicToVideo(videoKey, musicKey, authToken) {
  const url = `${API_CONFIG.BASE_URL}/music/add-music?video_key=${encodeURIComponent(videoKey)}&music_key=${encodeURIComponent(musicKey)}`;


  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response:", errorText);
      throw new Error(`Music overlay failed: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("ERROR inside addMusicToVideo:", err);
    throw err;
  }
}
