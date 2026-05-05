import * as React from "react";
import { Clock3, Paperclip, Pin, Send, MoreVertical, Reply, Smile } from "lucide-react";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Textarea } from "./textarea";
import MessageContextMenu from "./MessageContextMenu";
import { cn } from "../../lib/utils";

export type MessageBubbleProps = {
  message: {
    _id?: string;
    sender?: {
      _id?: string;
      username?: string;
      profile?: { profile_picture?: string };
    };
    content?: string;
    type?: string;
    media?: Array<{ url: string; url_public_id?: string }>;
    createdAt?: string;
    time?: string;
    is_pinned?: boolean;
    deleted_for_everyone?: boolean;
  };
  isOwn?: boolean;
  onDelete?: (everyone: boolean) => void;
  onReply?: () => void;
  onEdit?: () => void;
  onReact?: (emoji: string) => void;
  onPin?: () => void;
  onForward?: () => void;
};

export function MessageBubble({ message, isOwn = false, onDelete, onReply, onEdit, onReact, onPin, onForward }: MessageBubbleProps) {
  const senderName =
    message.sender?.username ||
    "User";
  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : message.time || "";
  const hasMedia = Array.isArray(message.media) && message.media.length > 0;

  return (
    <div className={cn("group flex gap-3 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300", isOwn ? "justify-end" : "justify-start")}> 
      {!isOwn && (
        <div className="shrink-0 self-end mb-1">
          <Avatar className="h-8 w-8 border border-border/50">
            <AvatarImage src={message.sender?.profile?.profile_picture} />
            <AvatarFallback className="bg-purple-100 text-purple-700 text-[10px]">
              {senderName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {!isOwn && (
          <span className="px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {senderName}
          </span>
        )}
        
        <div className="flex items-center gap-2">
          <MessageContextMenu
            messageId={message._id}
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
            className="opacity-0 group-hover:opacity-100"
          />

          <div
            className={cn(
              "relative max-w-[280px] sm:max-w-md px-4 py-3 shadow-sm transition-all hover:shadow-md",
              isOwn
                ? "bg-linear-to-br from-purple-600 to-indigo-600 text-white rounded-2xl rounded-br-none"
                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-800",
              message.deleted_for_everyone && "bg-muted text-muted-foreground opacity-60 italic"
            )}
          >
            {message.is_pinned && (
              <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-white/70">
                <Pin size={10} className="fill-white/70" /> Pinned
              </div>
            )}

            {message.deleted_for_everyone ? (
              <p className="text-sm italic">This message was deleted</p>
            ) : (message.content || hasMedia) ? (
              <>
                {message.type === "text" && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content || ""}</p>
                )}

                {hasMedia && (
                  <div className={cn("grid gap-2", message.media?.length > 1 ? "grid-cols-2" : "grid-cols-1", message.type === "text" ? "mt-3" : "")}>
                    {message.media?.map((item) => (
                      <img
                        key={item.url_public_id ?? item.url}
                        src={item.url}
                        alt="Message media"
                        className="w-full rounded-xl object-cover hover:scale-[1.02] transition-transform cursor-pointer"
                      />
                    ))}
                  </div>
                )}
              </>
            ) : null}

            <div className={cn("mt-1.5 flex items-center justify-end gap-1.5 text-[10px]", isOwn ? "text-purple-100/70" : "text-muted-foreground")}>
              <span>{formattedTime}</span>
            </div>
            
            {/* Reactions (Simple placeholder) */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="absolute -bottom-2 -left-1 flex gap-1 bg-white dark:bg-slate-700 border border-border px-1.5 py-0.5 rounded-full shadow-sm">
                {Object.entries(message.reactions).map(([emoji, count]) => (
                  <span key={emoji} className="text-[10px]">{emoji} {count}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type MessageComposerProps = {
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function MessageComposer({
  message,
  onMessageChange,
  onSend,
  onAttach,
  disabled,
  loading,
}: MessageComposerProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !loading && message.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="border-t border-border/50 bg-background/95 backdrop-blur-sm p-3 sm:p-4">
      <div className="flex items-end gap-2 max-w-5xl mx-auto">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onAttach}
          className="h-11 w-11 shrink-0 rounded-2xl border-dashed border-border hover:border-purple-500 hover:text-purple-600 transition-colors"
        >
          <Paperclip size={18} />
        </Button>

        <div className="relative flex-1">
          <Textarea
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-32 resize-none rounded-2xl border-border/50 bg-muted/30 px-4 py-3 text-sm focus-visible:ring-purple-500/20 focus-visible:border-purple-500 transition-all"
            rows={1}
          />
        </div>

        <Button
          type="button"
          size="icon"
          disabled={disabled || loading || !message.trim()}
          onClick={onSend}
          className={cn(
            "h-11 w-11 shrink-0 rounded-2xl shadow-lg transition-all active:scale-95",
            message.trim() ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-muted text-muted-foreground"
          )}
        >
          <Send size={18} className={cn(loading && "animate-pulse")} />
        </Button>
      </div>
    </div>
  );
}
