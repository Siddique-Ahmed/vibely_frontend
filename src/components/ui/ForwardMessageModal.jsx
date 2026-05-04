import React, { useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { ScrollArea } from "./scroll-area";
import { cn } from "../../lib/utils";

export function ForwardMessageModal({ open, onClose, chats = [], message, onForward }) {
  const [selectedChatIds, setSelectedChatIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleChat = (chatId) => {
    setSelectedChatIds((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
    );
  };

  const handleForward = async () => {
    if (selectedChatIds.length === 0) {
      alert("Please select at least one chat to forward to");
      return;
    }

    setLoading(true);
    try {
      await onForward(selectedChatIds);
      setSelectedChatIds([]);
      onClose();
    } catch (error) {
      console.error("Forward failed:", error);
      alert("Failed to forward message");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-xl border border-border/50 flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div>
            <h2 className="text-xl font-bold">Forward Message</h2>
            <p className="text-xs text-muted-foreground mt-1">Select chats to forward to</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={loading}
            className="rounded-full hover:bg-muted"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-6 space-y-3">
            {chats.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground italic">No chats available</p>
              </div>
            ) : (
              chats.map((chat) => {
                const getChatTitle = (c) => {
                  if (c.isGroup) return c.groupName || "Group chat";
                  const other = c.participants?.find((p) => p._id !== localStorage.getItem("userId"));
                  return other?.username || "Unknown";
                };

                const getChatAvatar = (c) => {
                  if (c.isGroup && c.groupImage) return c.groupImage;
                  const other = c.participants?.find((p) => p._id !== localStorage.getItem("userId"));
                  return other?.profile?.profile_picture;
                };

                return (
                  <div
                    key={chat._id}
                    onClick={() => toggleChat(chat._id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-muted/50",
                      selectedChatIds.includes(chat._id)
                        ? "bg-purple-100/80 dark:bg-purple-900/30 ring-1 ring-purple-200"
                        : ""
                    )}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getChatAvatar(chat)} />
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {getChatTitle(chat).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getChatTitle(chat)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {chat.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedChatIds.includes(chat._id)
                          ? "bg-purple-600 border-purple-600"
                          : "border-border bg-background"
                      )}
                    >
                      {selectedChatIds.includes(chat._id) && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            disabled={loading || selectedChatIds.length === 0}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2"
          >
            <Send size={16} />
            {loading ? "Forwarding..." : "Forward"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ForwardMessageModal;
