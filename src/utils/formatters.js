// Format timestamp to relative time (e.g., "2 hours ago")
export const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";

  return Math.floor(seconds) + "s";
};

// Format numbers (e.g., 1000 -> 1K)
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num;
};

// Truncate text
export const truncateText = (text, length = 100) => {
  return text.length > length ? text.slice(0, length) + "..." : text;
};

// Check if image URL is valid
export const isValidImageUrl = (url) => {
  return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(url);
};

// Check if video URL is valid
export const isValidVideoUrl = (url) => {
  return /\.(mp4|webm|mov|avi)$/i.test(url);
};
