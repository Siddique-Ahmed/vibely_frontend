// Notification types and messages
export const NOTIFICATION_TYPES = {
  LIKE: "like",
  COMMENT: "comment",
  FOLLOW: "follow",
  REPLY: "reply",
  MENTION: "mention",
  MESSAGE: "message",
  POST: "post",
};

// Post constants
export const POST_DEFAULTS = {
  MAX_IMAGES: 10,
  MAX_FILE_SIZE: 5242880, // 5MB
  ALLOWED_FORMATS: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
};

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 50,
};

// API response status
export const API_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

// Reaction types for likes
export const REACTION_TYPES = {
  LIKE: "like",
  LOVE: "love",
  HAHA: "haha",
  WOW: "wow",
  SAD: "sad",
  ANGRY: "angry",
};

// Block/Report reasons
export const REPORT_REASONS = [
  "Spam",
  "Harassment",
  "Hate speech",
  "Violence",
  "Sexual content",
  "Misleading information",
  "Copyright violation",
  "Other",
];

export const REPORT_PRIORITY = ["low", "medium", "high", "critical"];
