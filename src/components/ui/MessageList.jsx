import React, { useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "./scroll-area";
import { MessageItem } from "./MessageItem";
import { cn } from "../../lib/utils";

export function MessageList({
  messages = [],
  userId,
  isLoading = false,
  isTyping = false,
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

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <ScrollArea ref={scrollRef} className="flex-1 min-h-0 bg-muted/5">
      <div className="p-4 flex flex-col gap-2 max-w-5xl mx-auto">
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
          <div className="text-center text-sm text-muted-foreground py-8">
            Loading messages...
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        )}

        {isTyping && (
          <div className="text-[10px] text-muted-foreground italic animate-pulse flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
              <span
                className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <span
                className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </span>
            Vibing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
