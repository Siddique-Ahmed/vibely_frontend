import React from "react";
import { Link } from "react-router-dom";

/**
 * Replaces mentions (@username) with clickable links
 * @param {string} text - The text to process
 * @returns {Array<React.ReactNode>} - Processed text with links
 */
export const processMentions = (text, blockedUsernames = []) => {
  if (!text) return null;

  // Ensure blockedUsernames is an array of lowercase strings for consistent comparison
  const blockedSet = new Set(
    (blockedUsernames || []).map((u) => u.toLowerCase()),
  );

  // Regex to match @username - supports letters, numbers, underscores, and dots
  const mentionRegex = /@([a-zA-Z0-9._]+)/g;

  const result = [];
  let lastIndex = 0;
  let match;

  // Use exec to find all matches and their positions
  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      result.push(text.substring(lastIndex, match.index));
    }

    const username = match[1];
    const isBlocked = blockedSet.has(username.toLowerCase());

    if (isBlocked) {
      // If blocked, render as plain text (no link)
      result.push(
        <span
          key={`mention-blocked-${match.index}-${username}`}
          className="text-slate-500 dark:text-slate-400 font-medium italic"
          title="Blocked user"
        >
          @{username}
        </span>,
      );
    } else {
      // If not blocked, render as clickable link
      result.push(
        <Link
          key={`mention-${match.index}-${username}`}
          to={`/profile/${username}`}
          style={{ color: "#a855f7" }} // purple-500 fallback
          className="text-purple-600 dark:text-purple-300 font-bold hover:text-purple-800 dark:hover:text-purple-200 underline decoration-purple-600/30 dark:decoration-purple-300/30 underline-offset-2 transition-all duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          @{username}
        </Link>,
      );
    }

    lastIndex = mentionRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result.length > 0 ? result : text;
};
