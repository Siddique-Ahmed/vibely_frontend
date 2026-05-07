import React, { useMemo } from "react";
import { Pin, CornerUpRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import MessageContextMenu from "./MessageContextMenu";
import { cn } from "../../lib/utils";

const REACTION_EMOJI = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😠",
};

function truncate(text, max = 120) {
  if (!text) return "";
  const t = String(text).trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function ReplyPreview({ replyTo, isOwn }) {
  if (!replyTo || typeof replyTo === "string") return null;
  const senderLabel =
    replyTo.sender?.username || replyTo.sender?.profile?.full_name || "User";
  const preview = replyTo.deleted_for_everyone
    ? "Message deleted"
    : truncate(replyTo.content || "") ||
      (replyTo.media?.length ? "Media attachment" : "Message");

  return (
    <div
      className={cn(
        "mb-2 rounded-lg border-l-4 px-3 py-2 text-left text-xs",
        isOwn
          ? "border-white/80 bg-black/15 text-white/95"
          : "border-purple-500 bg-purple-500/10 text-foreground dark:bg-purple-500/15",
      )}
    >
      <p className="font-semibold opacity-90">{senderLabel}</p>
      <p className={cn("mt-0.5 opacity-80 line-clamp-2")}>{preview}</p>
    </div>
  );
}

export function MessageItem({
  message,
  isOwn = false,
  onDelete,
  onReply,
  onEdit,
  onReact,
  onPin,
  onForward,
  onMediaClick,
}) {
  const senderName =
    message.sender?.username || message.sender?.profile?.full_name || "User";

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : message.time || "";

  const hasMedia = Array.isArray(message.media) && message.media.length > 0;

  const copyText = useMemo(() => {
    if (message.deleted_for_everyone) return "";
    const parts = [];
    if (message.content?.trim()) parts.push(message.content.trim());
    if (hasMedia) parts.push("(media)");
    return parts.join(" ");
  }, [message.content, message.deleted_for_everyone, hasMedia]);

  const reactionSummary = useMemo(() => {
    const list = message.reactions;
    if (!Array.isArray(list) || list.length === 0) return [];
    const counts = {};
    for (const r of list) {
      const key = r.reaction || "like";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).map(([reaction, count]) => ({
      reaction,
      count,
      emoji: REACTION_EMOJI[reaction] || reaction,
    }));
  }, [message.reactions]);

  const bubble = (
    <div
      data-message-id={message._id}
      className={cn(
        "relative px-3.5 py-2 md:px-4 md:py-3 rounded-[1.25rem] transition-all duration-300 shadow-sm",
        isOwn
          ? "bg-linear-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none"
          : "bg-white dark:bg-slate-900 border border-border/40 text-slate-900 dark:text-slate-100 rounded-tl-none",
        message.deleted_for_everyone &&
          "bg-muted text-muted-foreground dark:bg-muted/80 border-transparent shadow-none italic",
      )}
    >
      {message.is_forwarded && !message.deleted_for_everyone && (
        <div
          className={cn(
            "mb-1 flex items-center gap-1.5 text-[10px] italic opacity-80",
            isOwn ? "text-white/90" : "text-muted-foreground",
          )}
        >
          <CornerUpRight className="h-3 w-3" aria-hidden /> Forwarded
        </div>
      )}

      {message.is_pinned && !message.deleted_for_everyone && (
        <div
          className={cn(
            "mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
            isOwn ? "text-white/80" : "text-purple-600 dark:text-purple-400",
          )}
        >
          <Pin className="h-3 w-3" aria-hidden /> Pinned
        </div>
      )}

      {message.reply_to && !message.deleted_for_everyone && (
        <ReplyPreview replyTo={message.reply_to} isOwn={isOwn} />
      )}

      {message.deleted_for_everyone ? (
        <p className="text-[13px] md:text-sm">This message was deleted</p>
      ) : (
        <>
          {!!message.content?.trim() && (
            <p className="text-[13px] md:text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
          {hasMedia && (
            <div
              className={cn(
                "grid gap-1.5",
                (message.media?.length || 0) > 1
                  ? "grid-cols-2"
                  : "grid-cols-1",
                message.content?.trim() ? "mt-2" : "",
              )}
            >
              {(message.media || []).map((item) =>
                item.type === "video" ? (
                  <button
                    type="button"
                    key={item.url_public_id || item.url}
                    className="relative w-full overflow-hidden rounded-xl bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 aspect-square sm:aspect-auto"
                    onClick={() =>
                      onMediaClick?.({
                        ...item,
                        type: "video",
                      })
                    }
                  >
                    <video
                      src={item.url}
                      className="max-h-56 w-full object-cover"
                      muted
                      playsInline
                    />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-slate-900">
                        Play video
                      </span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    key={item.url_public_id || item.url}
                    className="overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 aspect-square sm:aspect-auto"
                    onClick={() =>
                      onMediaClick?.({
                        ...item,
                        type: item.type || "image",
                      })
                    }
                  >
                    <img
                      src={item.url}
                      alt=""
                      className="max-h-56 w-full object-cover hover:opacity-95"
                    />
                  </button>
                ),
              )}
            </div>
          )}
        </>
      )}

      <div
        className={cn(
          "mt-1 flex items-center justify-end gap-1.5 text-[9px] md:text-[10px]",
          isOwn && !message.deleted_for_everyone
            ? "text-white/60"
            : "text-muted-foreground/60",
        )}
      >
        {message.is_edited && !message.deleted_for_everyone && (
          <span className="opacity-80">edited</span>
        )}
        <span>{formattedTime}</span>
      </div>

      {reactionSummary.length > 0 && !message.deleted_for_everyone && (
        <div
          className={cn(
            "pointer-events-none absolute -bottom-2.5 flex flex-wrap gap-1 rounded-full border px-1.5 py-0.5 text-[10px] md:text-[11px] shadow-md z-10",
            isOwn
              ? "-left-1 border-purple-100 bg-white dark:border-slate-800 dark:bg-slate-800"
              : "right-2 border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900",
          )}
        >
          {reactionSummary.map(({ reaction, emoji, count }) => (
            <span
              key={reaction}
              className="font-medium tabular-nums flex items-center gap-0.5"
            >
              <span>{emoji}</span>
              {count > 1 && <span className="opacity-70">{count}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "group flex gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300",
        reactionSummary.length > 0 ? "mb-6" : "mb-3.5",
        isOwn ? "justify-end" : "justify-start",
        "min-w-0",
      )}
    >
      {!isOwn && (
        <div className="mb-0.5 shrink-0 self-end">
          <Avatar className="h-7 w-7 md:h-8 md:w-8 border border-border/50 flex-shrink-0">
            <AvatarImage src={message.sender?.profile?.profile_picture} />
            <AvatarFallback className="bg-purple-100 text-purple-700 text-[10px] font-bold">
              {senderName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-0.5 min-w-0",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {!isOwn && (
          <span className="px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 truncate">
            {senderName}
          </span>
        )}

        <div
          className={cn(
            "flex items-center gap-1 min-w-0",
            isOwn ? "flex-row-reverse" : "flex-row",
          )}
        >
          <div className="shrink-0 md:opacity-0 md:group-hover:opacity-100 data-[state=open]:opacity-100 transition-all duration-200">
            <MessageContextMenu
              messageId={message._id}
              messageContent={copyText}
              isOwnMessage={isOwn}
              isPinned={message.is_pinned}
              onEdit={onEdit}
              onReply={onReply}
              onReact={onReact}
              onPin={onPin}
              onUnpin={onPin}
              onDeleteForMe={() => onDelete?.(false)}
              onDeleteForEveryone={() => onDelete?.(true)}
              onForward={onForward}
            />
          </div>
          {bubble}
        </div>
      </div>
    </div>
  );
}
