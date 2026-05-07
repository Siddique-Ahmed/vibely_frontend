import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// ─── Icon map ────────────────────────────────────────────────────────────────
const ICONS = {
  like: "♥",
  follow: "+",
  comment: "✦",
  reply: "↩",
  mention: "@",
  online: "●",
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
  message: "✉",
};

const LABELS = {
  like: "New like",
  follow: "New follower",
  comment: "New comment",
  reply: "New reply",
  mention: "Mention",
  online: "Online",
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
  message: "New message",
};

// ─── Variant styles (left accent + icon bg) ──────────────────────────────────
const VARIANTS = {
  success: {
    accent: "before:bg-green-700",
    iconBg: "bg-green-50 text-green-700",
  },
  error: {
    accent: "before:bg-red-700",
    iconBg: "bg-red-50 text-red-700",
  },
  warning: {
    accent: "before:bg-amber-600",
    iconBg: "bg-amber-50 text-amber-700",
  },
  info: {
    accent: "before:bg-blue-700",
    iconBg: "bg-blue-50 text-blue-700",
  },
  message: {
    accent: "before:bg-cyan-600",
    iconBg: "bg-cyan-50 text-cyan-700",
  },
  like: {
    accent: "before:bg-pink-700",
    iconBg: "bg-pink-50 text-pink-700",
  },
  follow: {
    accent: "before:bg-violet-700",
    iconBg: "bg-violet-50 text-violet-700",
  },
  comment: {
    accent: "before:bg-teal-700",
    iconBg: "bg-teal-50 text-teal-700",
  },
  online: {
    accent: "before:bg-emerald-700",
    iconBg: "bg-emerald-50 text-emerald-700",
  },
  reply: {
    accent: "before:bg-indigo-700",
    iconBg: "bg-indigo-50 text-indigo-700",
  },
  mention: {
    accent: "before:bg-orange-600",
    iconBg: "bg-orange-50 text-orange-700",
  },
};

// ─── Single Toast Item ────────────────────────────────────────────────────────
const VibelyToast = ({ id, message, type = "info", sender, duration = 4000, onClose, onClick }) => {
  const variant = VARIANTS[type] || VARIANTS.info;
  const hasSender = sender?.username;
  const initials = hasSender ? sender.username.charAt(0).toUpperCase() : "?";
  const icon = ICONS[type] || ICONS.info;
  const title = hasSender ? sender.username : LABELS[type] || "Notification";

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClick = (e) => {
    // Don't trigger if clicking the close button
    if (e.target.closest('button[data-radix-collection-item]')) return;
    if (onClick) onClick();
    onClose();
  };

  return (
    <Toast
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden flex items-start gap-3 p-4 pr-10 cursor-pointer",
        "bg-white dark:bg-zinc-900",
        "border border-zinc-200 dark:border-zinc-800",
        "rounded-xl shadow-lg",
        // Left accent bar via before pseudo
        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:rounded-l-xl",
        variant.accent
      )}
    >
      {/* Avatar (with sender) OR Icon (without sender) */}
      {hasSender ? (
        <div className="relative shrink-0">
          {sender.profile?.profile_picture ? (
            <img
              src={sender.profile.profile_picture}
              alt={sender.username}
              className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm",
              "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200",
              sender.profile?.profile_picture ? "hidden" : "flex"
            )}
          >
            {initials}
          </div>
          {/* Badge */}
          <div
            className={cn(
              "absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full",
              "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700",
              "flex items-center justify-center text-[10px]"
            )}
          >
            {icon}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0",
            variant.iconBg
          )}
        >
          {icon}
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <ToastTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate leading-snug">
          {title}
        </ToastTitle>
        <ToastDescription className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
          {message}
        </ToastDescription>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-1">just now</p>
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-200 dark:bg-zinc-700 origin-left"
        style={{
          animation: `shrink ${duration}ms linear forwards`,
        }}
      />

      <ToastClose />

      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </Toast>
  );
};

// ─── Toast Container ──────────────────────────────────────────────────────────
export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      setToasts((prev) => [
        ...prev.slice(-4), // max 5 at a time
        { id: Date.now(), ...e.detail },
      ]);
    };
    window.addEventListener("show-toast", handler);
    return () => window.removeEventListener("show-toast", handler);
  }, []);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <VibelyToast
          key={toast.id}
          {...toast}
          onClose={() => remove(toast.id)}
        />
      ))}
      <ToastViewport className="fixed bottom-6 right-6 flex flex-col-reverse gap-2 w-[360px] z-[99]" />
    </ToastProvider>
  );
};

export const showToast = ({ message = "", type = "info", duration = 4000, sender, notificationType, onClick } = {}) => {
  window.dispatchEvent(
    new CustomEvent("show-toast", {
      detail: { message, type: notificationType || type, duration, sender, onClick },
    })
  );
};