import { API_CONFIG } from '../constants/config';
import { apiClient } from './apiClient';

export async function fetchRecentActivities(limit = 50) {
  const url = `${API_CONFIG.BASE_URL}/activities/?limit=${limit}`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(" Error response:", errorText);
      throw new Error(`Failed to fetch activities: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error(" ERROR fetching activities:", err);
    throw err;
  }
}

export async function fetchActivitiesLastDays(days = 7) {
  const url = `${API_CONFIG.BASE_URL}/activities/recent?days=${days}`;

  try {
    const res = await apiClient.get(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch activities: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error(" ERROR fetching activities:", err);
    throw err;
  }
}

export async function createActivity(activityData) {
  const url = `${API_CONFIG.BASE_URL}/activities/`;

  try {
    const res = await apiClient.post(url, activityData);

    if (!res.ok) {
      throw new Error(`Failed to create activity: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error(" ERROR creating activity:", err);
    throw err;
  }
}

export async function deleteActivity(activityId) {
  const url = `${API_CONFIG.BASE_URL}/activities/${activityId}`;

  try {
    const res = await apiClient.delete(url);

    if (!res.ok) {
      throw new Error(`Failed to delete activity: ${res.status}`);
    }

    return true;

  } catch (err) {
    console.error("  ERROR deleting activity:", err);
    throw err;
  }
}
