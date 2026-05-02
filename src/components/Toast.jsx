import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';

/**
 * Professional Toast Notification Component
 * Displays real-time toast notifications with profile pictures for events like:
 * - User came online
 * - New notification received (like, comment, follow, etc.)
 */

export const Toast = ({ message, type = 'info', duration = 3000, onClose, sender, notificationType }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    online: 'bg-emerald-500',
    like: 'bg-pink-500',
    comment: 'bg-purple-500',
    follow: 'bg-indigo-500',
    reply: 'bg-violet-500',
    mention: 'bg-orange-500',
  }[type] || 'bg-blue-500';

  const iconMap = {
    like: '❤️',
    comment: '💬',
    follow: '👥',
    reply: '↩️',
    mention: '@',
    online: '🟢',
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  const icon = iconMap[type] || iconMap.info;

  // For notifications with sender info, show professional layout
  if (sender && notificationType) {
    return (
      <div
        className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 z-50 max-w-sm border border-white/20 backdrop-blur-sm`}
      >
        <div className="flex items-center gap-3">
          {/* Profile Picture */}
          <div className="relative">
            {sender.profile?.profile_picture ? (
              <img
                src={sender.profile.profile_picture}
                alt={sender.username}
                className="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            {/* Fallback: Initials */}
            <div
              className={`w-10 h-10 rounded-full border-2 border-white/30 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ${
                sender.profile?.profile_picture ? 'hidden' : ''
              }`}
            >
              {sender.username?.charAt(0).toUpperCase() || '?'}
            </div>
            {/* Notification Type Icon Overlay */}
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
              <span className="text-sm">{icon}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {sender.username}
            </p>
            <p className="text-xs opacity-90 truncate">
              {message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors ml-2"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Default simple toast for non-notification types
  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 z-50`}
    >
      <p className="font-medium">{message}</p>
    </div>
  );
};

export const ToastContainer = () => {
  const [toasts, setToasts] = React.useState([]);

  // Subscribe to toast events (we'll emit custom events from SocketContext)
  useEffect(() => {
    const handleToast = (event) => {
      const newToast = {
        id: Date.now(),
        ...event.detail,
      };
      setToasts((prev) => [...prev, newToast]);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration || 3000}
          sender={toast.sender}
          notificationType={toast.notificationType}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

/**
 * Utility to show toast notifications from anywhere
 * Usage: showToast({ message: 'Hello', type: 'success', sender: user, notificationType: 'like' })
 */
export const showToast = (options = {}) => {
  const { message = '', type = 'info', duration = 3000, sender, notificationType } = options;
  window.dispatchEvent(
    new CustomEvent('show-toast', {
      detail: { message, type, duration, sender, notificationType },
    })
  );
};
