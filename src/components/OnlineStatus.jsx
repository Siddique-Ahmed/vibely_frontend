import React from "react";
import { formatTimeAgo } from "../utils/formatters";

/**
 * OnlineStatus Component
 * Shows a green dot if user is online, otherwise shows last seen time
 * 
 * @param {Object} props
 * @param {boolean} props.isOnline - Whether user is online (is_online field)
 * @param {string|Date} props.lastSeen - User's last seen timestamp
 * @param {string} props.size - Size of the dot: 'sm', 'md', 'lg' (default: 'md')
 * @param {boolean} props.showLabel - Show "Online" or "Last seen..." label (default: false)
 */
const OnlineStatus = ({ isOnline, lastSeen, size = "md", showLabel = false }) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const dotSize = sizeClasses[size] || sizeClasses.md;

  if (isOnline) {
    return (
      <div className="flex items-center gap-2">
        <div className={`${dotSize} rounded-full bg-green-500 animate-pulse shadow-lg`} />
        {showLabel && <span className="text-xs font-medium text-green-600 dark:text-green-400">Online</span>}
      </div>
    );
  }

  if (lastSeen) {
    const lastSeenTime = formatTimeAgo(new Date(lastSeen));
    return (
      <div className="flex items-center gap-2">
        <div className={`${dotSize} rounded-full bg-slate-400 dark:bg-slate-600`} />
        {showLabel && (
          <span className="text-xs text-slate-600 dark:text-slate-400">
            Last seen {lastSeenTime}
          </span>
        )}
      </div>
    );
  }

  // If no lastSeen provided, show offline state
  return (
    <div className="flex items-center gap-2">
      <div className={`${dotSize} rounded-full bg-slate-400 dark:bg-slate-600`} />
      {showLabel && <span className="text-xs text-slate-600 dark:text-slate-400">Offline</span>}
    </div>
  );
};

export default OnlineStatus;
