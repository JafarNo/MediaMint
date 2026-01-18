import { API_CONFIG } from '../constants/config';
import { apiClient } from './apiClient';

/**
 * Submit a contact form message
 * @param {Object} contactData - Contact form data
 * @param {string} contactData.name - Sender's name
 * @param {string} contactData.email - Sender's email
 * @param {string} contactData.subject - Message subject
 * @param {string} contactData.message - Message content
 * @returns {Promise<Object>} Submission result
 */
export async function submitContactForm(contactData) {
  const url = `${API_CONFIG.BASE_URL}/contact/`;

  try {
    const res = await apiClient.post(url, contactData);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(" Contact form submission failed:", errorText);
      throw new Error(`Failed to submit contact form: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error(" ERROR submitting contact form:", err);
    throw err;
  }
}
