import React, { useEffect, useRef } from "react";
import { ScrollArea } from "./scroll-area";
import { MessageItem } from "./MessageItem";
import { cn } from "../../lib/utils";

export function MessageList({
  messages = [],
  userId,
  isLoading = false,
  isTyping = false,
  typingLabel = "",
  onDeleteMessage,
  onReplyMessage,
  onEditMessage,
  onReactMessage,
  onPinMessage,
  onForwardMessage,
  onMediaClick,
}) {
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const last = messages[messages.length - 1];
    const instant = last?._optimistic;
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: instant ? "auto" : "smooth",
        });
      }
    }
  }, [messages]);

  return (
    <ScrollArea
      ref={scrollRef}
      className="flex-1 min-h-0 bg-gradient-to-b from-muted/20 to-background dark:from-muted/5"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-1.5 px-3 py-3 sm:gap-2 sm:px-4 sm:py-4 lg:max-w-4xl">
        {messages && messages.length > 0 ? (
          messages.map((msg) => (
            <MessageItem
              key={msg._id}
              message={msg}
              isOwn={
                String(msg.sender?._id || msg.sender || "") ===
                String(userId || "")
              }
              onDelete={(everyone) =>
                onDeleteMessage?.(msg._id, everyone)
              }
              onReply={() => onReplyMessage?.(msg)}
              onEdit={() => onEditMessage?.(msg)}
              onPin={() => onPinMessage?.(msg)}
              onReact={(emoji) => onReactMessage?.(msg, emoji)}
              onForward={() => onForwardMessage?.(msg)}
              onMediaClick={onMediaClick}
            />
          ))
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
            Loading messages…
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground/80">No messages yet</p>
            <p className="mt-1 text-xs">Send a message to start the conversation.</p>
          </div>
        )}

        {isTyping && (
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/80 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-sm sm:text-sm">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500" />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400"
                style={{ animationDelay: "0.12s" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-300"
                style={{ animationDelay: "0.24s" }}
              />
            </span>
            <span className="font-medium text-foreground/85">
              {typingLabel ? `${typingLabel} is typing…` : "Someone is typing…"}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
