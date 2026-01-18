/**
 * Post Helper Utilities
 * Shared helper functions for post-related components
 */

/**
 * Get status color configuration for a post status
 * @param {string} status - Post status ('draft', 'scheduled', 'published')
 * @returns {Object} Color configuration with bg, text, and icon
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'draft':
      return { bg: '#FEF3C7', text: '#D97706', icon: 'document-outline' };
    case 'scheduled':
      return { bg: '#DBEAFE', text: '#2563EB', icon: 'calendar-outline' };
    case 'published':
      return { bg: '#D1FAE5', text: '#059669', icon: 'checkmark-circle-outline' };
    default:
      return { bg: '#F3F4F6', text: '#6B7280', icon: 'help-outline' };
  }
};

/**
 * Status filter options for posts
 */
export const STATUS_FILTERS = [
  { id: 'all', label: 'All', icon: 'grid-outline', color: '#6B7280' },
  { id: 'draft', label: 'Drafts', icon: 'document-outline', color: '#F59E0B' },
  { id: 'scheduled', label: 'Scheduled', icon: 'calendar-outline', color: '#3B82F6' },
  { id: 'published', label: 'Published', icon: 'checkmark-circle-outline', color: '#10B981' },
];

/**
 * Format a date for display
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export const formatPostDate = (date, includeTime = false) => {
  if (!date) return 'Unknown date';
  
  const d = new Date(date);
  const dateStr = d.toLocaleDateString();
  
  if (includeTime) {
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} at ${timeStr}`;
  }
  
  return dateStr;
};

/**
 * Get display text for scheduled date
 * @param {Object} post - Post object
 * @returns {string} Display text for the date
 */
export const getPostDateDisplay = (post) => {
  if (post.status === 'scheduled' && post.scheduled_at) {
    return `Scheduled: ${formatPostDate(post.scheduled_at, true)}`;
  }
  return formatPostDate(post.created_at);
};
