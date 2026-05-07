import React, { useState } from "react";
import { MoreVertical, Copy, Edit2, Reply, Share2, Pin, Trash2, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "./dropdown-menu";
import { cn } from "../../lib/utils";

export const MessageContextMenu = ({
  messageId,
  messageContent = "",
  isOwnMessage,
  isPinned,
  onEdit,
  onReply,
  onReact,
  onPin,
  onUnpin,
  onDeleteForMe,
  onDeleteForEveryone,
  onForward,
  isLoading = false,
  className = "",
}) => {
  const handleCopyMessage = () => {
    const text =
      typeof messageContent === "string" && messageContent.trim()
        ? messageContent.trim()
        : document.querySelector(`[data-message-id="${messageId}"]`)?.innerText;
    if (text) navigator.clipboard.writeText(text);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 hover:bg-muted/80",
            className
          )}
          disabled={isLoading}
        >
          <MoreVertical size={16} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48 z-90">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Message Options
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Universal actions */}
        <DropdownMenuItem onClick={handleCopyMessage}>
          <Copy size={16} className="mr-2" />
          <span>Copy Text</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onReply}>
          <Reply size={16} className="mr-2" />
          <span>Reply</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onForward}>
          <Share2 size={16} className="mr-2" />
          <span>Forward</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Own message actions */}
        {isOwnMessage && (
          <>
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 size={16} className="mr-2" />
              <span>Edit</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={isPinned ? onUnpin : onPin}>
              <Pin size={16} className="mr-2" />
              <span>{isPinned ? "Unpin" : "Pin"}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onDeleteForEveryone} className="text-red-600 dark:text-red-400">
              <Trash2 size={16} className="mr-2" />
              <span>Delete for Everyone</span>
            </DropdownMenuItem>
          </>
        )}

        {/* Delete for me (everyone can do this) */}
        <DropdownMenuItem onClick={onDeleteForMe} className="text-orange-600 dark:text-orange-400">
          <RotateCcw size={16} className="mr-2" />
          <span>Delete for Me</span>
        </DropdownMenuItem>

        {/* Report message */}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 dark:text-red-400">
          <AlertCircle size={16} className="mr-2" />
          <span>Report</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MessageContextMenu;
