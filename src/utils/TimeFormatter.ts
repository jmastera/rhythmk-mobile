// Time formatting utilities

/**
 * Formats seconds to a time string (HH:MM:SS or MM:SS)
 * @param seconds Total seconds to format
 * @param includeHours Whether to always include hours even if zero
 */
export const formatTime = (seconds: number, includeHours = false): string => {
  if (isNaN(seconds) || seconds < 0) {
    return includeHours ? '00:00:00' : '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0 || includeHours) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};

/**
 * Formats a date object to a readable string (e.g., "June 7, 2025")
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formats a date object to a time string (e.g., "3:45 PM")
 */
export const formatTimeOfDay = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Gets a relative time description (e.g., "Today", "Yesterday", "Last week")
 */
export const getRelativeTimeDescription = (date: Date): string => {
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else {
    return formatDate(date);
  }
};
