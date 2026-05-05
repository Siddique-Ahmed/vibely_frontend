import React, { useMemo } from "react";
import { Pin, Loader2 } from "lucide-react";
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
    replyTo.sender?.username ||
    replyTo.sender?.profile?.full_name ||
    "User";
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
    message.sender?.username ||
    message.sender?.profile?.full_name ||
    "User";

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

  const isPending = Boolean(message._optimistic);

  const bubble = (
    <div
      data-message-id={message._id}
      className={cn(
        "relative px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl transition-all duration-200",
        isOwn
          ? "bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-500/15"
          : "bg-card dark:bg-slate-900/95 border border-border/50 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-sm",
        message.deleted_for_everyone &&
          "bg-muted text-muted-foreground dark:bg-muted/80 border-transparent shadow-none italic",
        isPending && "opacity-90 ring-1 ring-white/25",
      )}
    >
      {message.is_pinned && !message.deleted_for_everyone && (
        <div
          className={cn(
            "mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
            isOwn ? "text-white/80" : "text-muted-foreground",
          )}
        >
          <Pin className="h-3 w-3" aria-hidden /> Pinned
        </div>
      )}

      {message.reply_to && !message.deleted_for_everyone && (
        <ReplyPreview replyTo={message.reply_to} isOwn={isOwn} />
      )}

      {message.deleted_for_everyone ? (
        <p className="text-sm">This message was deleted</p>
      ) : (
        <>
          {!!message.content?.trim() && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
          {hasMedia && (
            <div
              className={cn(
                "grid gap-2",
                (message.media?.length || 0) > 1 ? "grid-cols-2" : "grid-cols-1",
                message.content?.trim() ? "mt-2" : "",
              )}
            >
              {(message.media || []).map((item) =>
                item.type === "video" ? (
                  <button
                    type="button"
                    key={item.url_public_id || item.url}
                    className="relative w-full overflow-hidden rounded-xl bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
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
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">
                        Play video
                      </span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    key={item.url_public_id || item.url}
                    className="overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
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
          "mt-2 flex flex-wrap items-center justify-end gap-2 text-[10px]",
          isOwn && !message.deleted_for_everyone
            ? "text-white/70"
            : "text-muted-foreground",
        )}
      >
        {message.is_edited && !message.deleted_for_everyone && (
          <span className="mr-auto opacity-80">Edited</span>
        )}
        {isPending && isOwn && (
          <span className="mr-auto inline-flex items-center gap-1 text-[10px] font-medium text-white/90">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden />
            Sending
          </span>
        )}
        <span>{formattedTime}</span>
      </div>

      {reactionSummary.length > 0 && !message.deleted_for_everyone && (
        <div
          className={cn(
            "pointer-events-none absolute -bottom-2 flex flex-wrap gap-1 rounded-full border px-2 py-0.5 text-[11px] shadow-sm",
            isOwn
              ? "-left-1 border-purple-200 bg-white dark:border-border dark:bg-slate-800"
              : "right-2 border-border bg-card",
          )}
        >
          {reactionSummary.map(({ reaction, emoji, count }) => (
            <span key={reaction} className="font-medium tabular-nums">
              {emoji}
              {count > 1 ? ` ${count}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "group flex gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200",
        reactionSummary.length > 0 ? "mb-4 sm:mb-5" : "mb-2 sm:mb-3",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      {!isOwn && (
        <div className="mb-1 shrink-0 self-end">
          <Avatar className="h-8 w-8 border border-border/50">
            <AvatarImage src={message.sender?.profile?.profile_picture} />
            <AvatarFallback className="bg-purple-100 text-purple-700 text-[10px]">
              {senderName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

        <div
          className={cn(
            "flex min-w-0 max-w-[min(92vw,28rem)] flex-col gap-1 sm:max-w-[min(85%,32rem)]",
            isOwn ? "items-end" : "items-start",
          )}
        >
        {!isOwn && (
          <span className="px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {senderName}
          </span>
        )}

        <div
          className={cn(
            "flex min-w-0 items-end gap-1.5 sm:gap-2",
            isOwn ? "flex-row-reverse" : "flex-row",
          )}
        >
          {!isPending && (
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
            className="opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
          />
          )}
          {bubble}
        </div>
      </div>
    </div>
  );
}
