/**
 * Simple callback-based auth event system
 * Used to trigger logout when API calls return 401 and token refresh fails
 */

let unauthorizedCallback = null;

export function setUnauthorizedCallback(callback) {
  unauthorizedCallback = callback;
}

export function emitUnauthorized() {
  if (unauthorizedCallback) {
    unauthorizedCallback();
  }
}
