import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Edit, Phone, Video, Info, MessageCircle, MoreVertical, ArrowLeft, Paperclip, Send, BellOff, Archive, Trash2, Pin, CornerUpRight, Eraser, Ban, LayoutList, Clock3, X, Users } from "lucide-react";
import MainLayout from "../components/layouts/MainLayout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useSelector } from "react-redux";
import { 
  useChats, useMessages, useSendMessage, useMarkAsSeen, 
  useDeleteMessageForEveryone, useDeleteMessageForMe, useEditMessage, 
  useReactToMessage, useDeleteChat, useArchiveChat, useMuteChat,
  usePinMessage, useUnpinMessage, useForwardMessage,
  useCreateGroup, useFollowing, useFollowers,
  useChatDetail,
  useClearChat,
  useToggleBlock,
  useCreateChat,
} from "../hooks/useApi";
import { MessageComposer } from "../components/ui/message";
import { MessageList } from "../components/ui/MessageList";
import CreateGroupModal from "../components/ui/CreateGroupModal";
import NewChatModal from "../components/ui/NewChatModal";
import { GroupMembersPanel } from "../components/ui/GroupMembersPanel";
import ForwardMessageModal from "../components/ui/ForwardMessageModal";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import { useSocket } from "../hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";
import { showToast } from "../components/Toast";
import { getSocketChatId } from "../utils/socketChatId";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function getChatActionError(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    "Something went wrong"
  );
}

const Messages = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [activeChatId, setActiveChatId] = useState(null);
  const [draft, setDraft] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingFrom, setTypingFrom] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [confirmClearChat, setConfirmClearChat] = useState(false);
  const [confirmBlockUser, setConfirmBlockUser] = useState(false);
  const [confirmDeleteChat, setConfirmDeleteChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  
  const [statusUpdates, setStatusUpdates] = useState({}); // userId -> { isOnline, lastSeen }
  const [isSending, setIsSending] = useState(false); // Prevent multiple simultaneous sends
  
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  
  const { data: chatsResponse, isLoading: loadingChats, isError: chatsError } = useChats(1, 20);
  const [searchParams, setSearchParams] = useSearchParams();
  const chats = chatsResponse?.data?.chats || [];
  const chatIdStr = activeChatId != null ? String(activeChatId) : null;
  const activeChat =
    chats.find((chat) => String(chat._id) === chatIdStr) || null;

  const markAsSeenMutation = useMarkAsSeen();
  const { data: chatDetailResponse } = useChatDetail(chatIdStr || undefined);
  const chatDetail = chatDetailResponse?.data?.detail;
  
  const deleteEveryoneMutation = useDeleteMessageForEveryone();
  const deleteMeMutation = useDeleteMessageForMe();
  const sendMessageMutation = useSendMessage({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages"],
        exact: false,
      });
      // Also invalidate chats list to update sidebar with new message
      queryClient.invalidateQueries({
        queryKey: ["chats"],
        exact: false,
      });
    },
  });
  const editMessageMutation = useEditMessage({
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["messages"],
        exact: false,
      }),
  });
  
  const archiveChatMutation = useArchiveChat();
  const clearChatMutation = useClearChat();
  const toggleBlockMutation = useToggleBlock();
  const muteChatMutation = useMuteChat();
  const deleteChatMutation = useDeleteChat();
  const pinMessageMutation = usePinMessage();
  const unpinMessageMutation = useUnpinMessage();
  const reactMessageMutation = useReactToMessage();
  const forwardMessageMutation = useForwardMessage();
  const createGroupMutation = useCreateGroup({
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["chats"],
        exact: false,
      }),
  });

  const createChatMutation = useCreateChat({
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["chats"],
        exact: false,
      });
      const chatId = response?.data?.chat?._id;
      if (chatId) {
        setActiveChatId(String(chatId));
      }
    },
  });
  
  // Backend allows max limit 50 for these endpoints — higher values fail with 400
  const {
    data: followingResponse,
    isFetching: loadingFollowingContacts,
    isError: followingContactsError,
  } = useFollowing(1, 50);
  const {
    data: followersResponse,
    isFetching: loadingFollowersContacts,
    isError: followersContactsError,
  } = useFollowers(1, 50);

  const contactsForGroup = useMemo(() => {
    const fromFollowing = followingResponse?.data?.following ?? [];
    const fromFollowers = followersResponse?.data?.followers ?? [];
    const map = new Map();
    for (const u of [...fromFollowing, ...fromFollowers]) {
      if (!u?._id) continue;
      if (String(u._id) === String(user?._id)) continue;
      map.set(String(u._id), u);
    }
    return [...map.values()];
  }, [
    followingResponse?.data?.following,
    followersResponse?.data?.followers,
    user?._id,
  ]);

  // Helper functions for chat display
  const getChatTitle = (chat) => {
    if (!chat) return "Chat";
    if (chat.isGroup) return chat.groupName || "Group chat";
    const other = chat.participants?.find(
      (p) => String(p._id) !== String(user?._id),
    );
    return other?.username || other?.profile?.full_name || "Friend";
  };

  const getChatAvatar = (chat) => {
    if (!chat) return null;
    if (chat.isGroup && chat.groupImage) return chat.groupImage;
    const other =
      chat.participants?.find((p) => String(p._id) !== String(user?._id)) ||
      chat.participants?.[0];
    return other?.profile?.profile_picture;
  };

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    
    return chats.filter((chat) => {
      const title = getChatTitle(chat).toLowerCase();
      const lastMessage = (chat.lastMessage?.content ?? "").toLowerCase();
      return title.includes(q) || lastMessage.includes(q);
    });
  }, [chats, searchQuery]);

  // Sync activeChatId with URL
  useEffect(() => {
    const chatIdFromUrl = searchParams.get("chatId");
    if (chatIdFromUrl && String(chatIdFromUrl) !== String(activeChatId ?? "")) {
      setActiveChatId(String(chatIdFromUrl));
    }
  }, [searchParams]);

  useEffect(() => {
    if (chatIdStr) {
      setSearchParams({ chatId: chatIdStr });
      markAsSeenMutation.mutate(chatIdStr);
    } else {
      setSearchParams({});
    }
  }, [chatIdStr, setSearchParams]);

  /** Typing: emit to server when draft changes (debounced stop). */
  useEffect(() => {
    if (!socket || !chatIdStr) return;
    const room = chatIdStr;
    return () => {
      socket.emit("stop typing", { room });
    };
  }, [socket, chatIdStr]);

  useEffect(() => {
    if (!socket || !chatIdStr) return;
    const room = chatIdStr;
    if (!draft.trim()) {
      socket.emit("stop typing", { room });
      return;
    }
    socket.emit("typing", { room });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop typing", { room });
    }, 2000);
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [draft, socket, chatIdStr]);

  /** Delete-for-everyone + similar updates from Socket.IO room */
  useEffect(() => {
    if (!socket) return;
    const onMessageMutated = () => {
      queryClient.invalidateQueries({ queryKey: ["messages"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["chats"], exact: false });
    };
    socket.on("message mutated", onMessageMutated);
    return () => socket.off("message mutated", onMessageMutated);
  }, [socket, queryClient]);

  useEffect(() => {
    if (!socket || !chatIdStr) return;

    console.log("🔗 Joining chat room:", chatIdStr);
    socket.emit("join chat", chatIdStr);

    const handleNewMessage = (newMessage) => {
      console.log("📩 Real-time message received:", newMessage);
      const messageChatId = getSocketChatId(newMessage);
      const currentChatId = chatIdStr;
      
      console.log(`📍 Chat IDs - Message: ${messageChatId}, Current: ${currentChatId}`);
      
      if (messageChatId === currentChatId) {
        console.log("✅ Message is for current chat! Invalidating query...");
        
        // Invalidate ALL message queries to force refetch
        queryClient.invalidateQueries({
          queryKey: ["messages"],
        });

        // Mark as seen
        markAsSeenMutation.mutate(chatIdStr);
      }
      
      // ALWAYS invalidate chats list to show new message/count in sidebar
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["unreadMessageCount"] });
    };

    const handleTyping = (data) => {
      const room = String(data?.room ?? "");
      if (!room || room !== chatIdStr) return;
      if (data?.userId != null && String(data.userId) === String(user?._id)) return;
      setIsTyping(true);
      setTypingFrom(data?.username ? String(data.username) : "Someone");
    };

    const handleStopTyping = (data) => {
      const room = String(data?.room ?? "");
      if (!room || room !== chatIdStr) return;
      if (data?.userId != null && String(data.userId) === String(user?._id)) return;
      setIsTyping(false);
      setTypingFrom("");
    };

    console.log("📡 Attaching socket listeners");
    socket.on("message received", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stop typing", handleStopTyping);

    socket.on("user status changed", (data) => {
      setStatusUpdates((prev) => ({
        ...prev,
        [data.userId]: {
          isOnline: data.status === "online",
          lastSeen: data.status === "offline" ? data.timestamp : null,
        },
      }));
    });

    return () => {
      console.log("🔌 Removing socket listeners");
      socket.off("message received", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stop typing", handleStopTyping);
      socket.off("user status changed");
    };
  }, [socket, chatIdStr, queryClient, markAsSeenMutation, user?._id]);

  const { data: messagesResponse, isLoading: loadingMessages } = useMessages(
    chatIdStr || undefined,
    1,
    50,
  );
  const messages = messagesResponse?.data?.messages || [];

  // Handlers
  const handleSend = async () => {
    // Prevent multiple simultaneous sends
    if (isSending || sendMessageMutation.isPending || editMessageMutation.isPending) return;
    
    const filesToSend = previewFiles.length > 0 ? previewFiles.map(p => p.file) : attachedFiles;
    const sendChatId = chatIdStr || (activeChat?._id != null ? String(activeChat._id) : null);
    
    // Validate inputs
    if (!sendChatId || (!draft.trim() && filesToSend.length === 0)) return;
    
    try {
      setIsSending(true);
      
      if (editingMessage) {
        await editMessageMutation.mutateAsync({ messageId: editingMessage._id, content: draft.trim() });
      } else {
        await sendMessageMutation.mutateAsync({
          chatId: sendChatId,
          content: draft.trim(),
          type: filesToSend.length > 0 ? (filesToSend[0].type.startsWith('video') ? 'video' : 'image') : "text",
          mediaFiles: filesToSend,
          reply_to: replyTo?._id || null,
        });
      }
      
      // Clear form only after successful send
      setDraft("");
      setAttachedFiles([]);
      setPreviewFiles([]);
      setReplyTo(null);
      setEditingMessage(null);
    } catch (error) {
      console.error("Operation failed", error);
      showToast({ message: getChatActionError(error), type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = (msg) => {
    setEditingMessage(msg);
    setDraft(msg.content || "");
    setReplyTo(null);
  };

  const handlePinMessage = async (msg) => {
    try {
      if (msg.is_pinned) {
        await unpinMessageMutation.mutateAsync(msg._id);
      } else {
        await pinMessageMutation.mutateAsync(msg._id);
      }
    } catch (e) { console.error("Pin failed", e); }
  };

  const handleReactMessage = async (msg, emoji) => {
    try {
      await reactMessageMutation.mutateAsync({ messageId: msg._id, reaction: emoji });
    } catch (e) { console.error("React failed", e); }
  };

  const handleForwardMessage = (msg) => {
    setForwardingMessage(msg);
    setShowForwardModal(true);
  };

  const handleForwardToChats = async (chatIds) => {
    if (!forwardingMessage || chatIds.length === 0) return;
    try {
      await forwardMessageMutation.mutateAsync({
        messageId: forwardingMessage._id,
        targetChats: chatIds,
      });
      setForwardingMessage(null);
      setShowForwardModal(false);
      showToast({ message: "Message forwarded", type: "success" });
    } catch (error) {
      console.error("Forward failed:", error);
      showToast({ message: getChatActionError(error), type: "error" });
    }
  };

  const handleMute = async () => {
    if (!chatIdStr) return;
    try {
      const res = await muteChatMutation.mutateAsync(chatIdStr);
      showToast({
        message: res?.message || "Notification settings updated",
        type: "success",
      });
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const handleArchive = async () => {
    if (!chatIdStr) return;
    try {
      const res = await archiveChatMutation.mutateAsync(chatIdStr);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["archivedChats"] });
      showToast({
        message: res?.message || "Chat archived",
        type: "success",
      });
      setActiveChatId(null);
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const executeDeleteChat = async () => {
    if (!chatIdStr) return;
    try {
      const res = await deleteChatMutation.mutateAsync(chatIdStr);
      setConfirmDeleteChat(false);
      setActiveChatId(null);
      showToast({
        message: res?.message || "Chat deleted",
        type: "success",
      });
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const executeClearChat = async () => {
    if (!chatIdStr) return;
    try {
      const res = await clearChatMutation.mutateAsync(chatIdStr);
      queryClient.invalidateQueries({ queryKey: ["chatDetail", chatIdStr] });
      setConfirmClearChat(false);
      showToast({
        message: res?.message || "Chat cleared for you",
        type: "success",
      });
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const otherDmUser =
    activeChat && !activeChat.isGroup
      ? activeChat.participants?.find(
          (p) => String(p._id) !== String(user?._id),
        )
      : null;

  const executeBlockUser = async () => {
    if (!otherDmUser?._id) return;
    try {
      const res = await toggleBlockMutation.mutateAsync(otherDmUser._id);
      setConfirmBlockUser(false);
      showToast({
        message:
          res?.message ||
          res?.data?.message ||
          "Block status updated",
        type: "success",
      });
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const openChatDetail = () => {
    if (!chatIdStr) return;
    navigate(`/messages/${chatIdStr}/detail`);
  };

  const handleDeleteMessage = async (msgId, everyone) => {
    try {
      if (everyone) {
        await deleteEveryoneMutation.mutateAsync(msgId);
      } else {
        await deleteMeMutation.mutateAsync(msgId);
      }
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  return (
    <MainLayout sidebar={<Sidebar />} topbar={<Topbar />} hideBottomNav={!!activeChat}>
      <div className={cn(
        "w-full max-w-7xl mx-auto flex overflow-hidden bg-background relative min-h-0 transition-all duration-300",
        activeChat 
          ? "h-[calc(100vh-60px)] md:h-[calc(100vh-60px)]" 
          : "h-[calc(100vh-124px)] md:h-[calc(100vh-90px)]"
      )}>
        {/* Image Preview Overlay */}
        {previewFiles.length > 0 && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col animate-in fade-in zoom-in duration-300">
             <div className="flex items-center justify-between p-4 text-white">
               <Button variant="ghost" size="icon" onClick={() => setPreviewFiles([])} className="text-white hover:bg-white/10">
                 <X size={20} />
               </Button>
               <span className="text-sm font-medium">{previewFiles.length} item(s) selected</span>
               <div className="w-10" />
             </div>
             <div className="flex-1 flex items-center justify-center p-4">
               <img src={previewFiles[0].url} className="max-h-full rounded-lg shadow-2xl object-contain" alt="Preview" />
             </div>
             <div className="p-4 bg-slate-900 border-t border-white/10">
                <div className="max-w-4xl mx-auto flex items-end gap-3">
                  <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a caption..." className="bg-white/10 border-none text-white focus-visible:ring-0" />
                  <Button onClick={handleSend} disabled={isSending || sendMessageMutation.isPending || !draft.trim()} className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSending || sendMessageMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                  </Button>
                </div>
             </div>
          </div>
        )}

        {/* Chat List */}
        <div className={cn("w-full lg:w-[400px] xl:w-[450px] shrink-0 flex flex-col border-r border-border/40 bg-background transition-all duration-300 min-h-0", activeChat ? "hidden lg:flex" : "flex")}>
            <div className="p-6 space-y-5">
             <div className="flex items-center justify-between">
               <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Messages</h1>
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-100 transition-all">
                     <Edit size={20} />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-lg border-border/40 bg-background/95 backdrop-blur-md">
                   <DropdownMenuItem onClick={() => setShowNewChatModal(true)} className="gap-3 py-2.5 px-3 rounded-xl focus:bg-purple-50 focus:text-purple-600 cursor-pointer">
                     <MessageCircle size={16} className="text-purple-600" />
                     <div className="flex flex-col gap-0.5">
                       <span className="font-bold text-sm">New Chat</span>
                       <span className="text-xs text-muted-foreground">Start a 1-on-1 conversation</span>
                     </div>
                   </DropdownMenuItem>
                   <DropdownMenuSeparator className="bg-border/30" />
                   <DropdownMenuItem onClick={() => setShowNewGroupModal(true)} className="gap-3 py-2.5 px-3 rounded-xl focus:bg-purple-50 focus:text-purple-600 cursor-pointer">
                     <Users size={16} className="text-purple-600" />
                     <div className="flex flex-col gap-0.5">
                       <span className="font-bold text-sm">New Group</span>
                       <span className="text-xs text-muted-foreground">Create a group chat</span>
                     </div>
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             </div>
             
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-purple-500 transition-colors" size={18} />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..." 
                  className="pl-11 h-12 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border-none focus-visible:ring-2 focus-visible:ring-purple-500/20 transition-all" 
                />
              </div>

              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 rounded-2xl border-purple-100 dark:border-purple-900/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 transition-all text-muted-foreground py-6 shadow-sm group"
                onClick={() => navigate("/archived-chats")}
              >
                <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Archive size={18} className="text-purple-600" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-200">Archived Chats</span>
                  <span className="text-[9px] font-medium opacity-60 uppercase tracking-widest">Hidden conversations</span>
                </div>
                <div className="ml-auto bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg">View</div>
              </Button>
             </div>
           
           <ScrollArea className="flex-1 px-3 pb-6">
             <div className="space-y-1">
               {filteredChats.map((chat) => (
                 <div
                   key={chat._id}
                 onClick={() => {
                    setActiveChatId(String(chat._id));
                    setShowInfo(false);
                  }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all duration-300 relative group mb-1",
                    chatIdStr === String(chat._id)
                       ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 -translate-y-0.5"
                       : "hover:bg-slate-100 dark:hover:bg-slate-900/40"
                   )}
                 >
                   <div className="relative shrink-0">
                     <Avatar className={cn(
                       "h-14 w-14 border-2 transition-all",
                       chatIdStr === String(chat._id) ? "border-white/30 scale-105" : "border-background"
                     )}>
                       <AvatarImage src={getChatAvatar(chat)} />
                       <AvatarFallback className={cn(
                         "font-bold",
                         chatIdStr === String(chat._id) ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                       )}>
                         {getChatTitle(chat).substring(0, 2).toUpperCase()}
                       </AvatarFallback>
                     </Avatar>
                      {!chat.isGroup && (() => {
                        const otherInList = chat.participants?.find(p => String(p._id || p) !== String(user?._id));
                        const isUserOnline = statusUpdates[otherInList?._id]?.isOnline ?? otherInList?.is_online;
                        return isUserOnline && (
                          <span className={cn(
                            "absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                            "bg-green-500 shadow-sm"
                          )} />
                        );
                      })()}
                   </div>
                   
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start mb-0.5">
                       <h3 className={cn(
                         "font-bold truncate",
                         chatIdStr === String(chat._id) ? "text-white" : "text-slate-900 dark:text-slate-100"
                       )}>
                         {getChatTitle(chat)}
                       </h3>
                       <span className={cn(
                         "text-[10px] font-medium whitespace-nowrap ml-2",
                         chatIdStr === String(chat._id) ? "text-white/70" : "text-muted-foreground"
                       )}>
                         {chat.lastMessage ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                       </span>
                     </div>
                     <p className={cn(
                       "text-xs truncate font-medium",
                       chatIdStr === String(chat._id) ? "text-white/80" : "text-muted-foreground/90"
                     )}>
                       {chat.lastMessage?.content || "Start a conversation..."}
                     </p>
                   </div>
                   
                   {(chat.unread_count || 0) > 0 && chatIdStr !== String(chat._id) && (
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-md ring-2 ring-background">
                       {chat.unread_count}
                     </div>
                   )}
                 </div>
               ))}
             </div>
           </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className={cn("flex-1 flex flex-col bg-background transition-all duration-300 min-h-0", !activeChat ? "hidden lg:flex" : "flex")}>
          {activeChat ? (
            <>
               {/* Header */}
               <div className="h-16 md:h-20 px-4 md:px-6 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
                 <div className="flex items-center gap-4">
                   <Button variant="ghost" size="icon" onClick={() => setActiveChatId(null)} className="lg:hidden rounded-full"><ArrowLeft size={20} /></Button>
                   <div className="relative">
                     <Avatar className="h-11 w-11 border-2 border-purple-100 dark:border-purple-900/50 shadow-sm">
                       <AvatarImage src={getChatAvatar(activeChat)} />
                       <AvatarFallback className="bg-linear-to-br from-purple-100 to-indigo-100 text-purple-700 font-bold">{getChatTitle(activeChat).substring(0, 2).toUpperCase()}</AvatarFallback>
                     </Avatar>
                     {(() => {
                       const status = statusUpdates[otherDmUser?._id] || { 
                         isOnline: otherDmUser?.is_online, 
                         lastSeen: otherDmUser?.last_seen 
                       };
                       return status.isOnline && (
                         <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                       );
                     })()}
                   </div>
                   <div className="min-w-0">
                     <h2 className="text-sm md:text-[16px] font-black leading-none truncate text-slate-900 dark:text-slate-100">{getChatTitle(activeChat)}</h2>
                     {activeChat.isGroup ? (
                       <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold mt-1 md:mt-1.5 flex items-center gap-1.5 uppercase tracking-widest">
                         {activeChat.participants?.length || 0} Members
                       </p>
                     ) : (
                       (() => {
                         const status = statusUpdates[otherDmUser?._id] || { 
                           isOnline: otherDmUser?.is_online, 
                           lastSeen: otherDmUser?.last_seen 
                         };
                         return status.isOnline ? (
                           <p className="text-[9px] md:text-[10px] text-green-500 font-bold mt-1 md:mt-1.5 flex items-center gap-1.5 uppercase tracking-widest">
                             <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse" /> Online
                           </p>
                         ) : (
                           <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold mt-1 md:mt-1.5 flex items-center gap-1.5 uppercase tracking-widest">
                             Offline {status.lastSeen && `• Last seen ${new Date(status.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                           </p>
                         );
                       })()
                     )}
                   </div>
                 </div>
                 <div className="flex items-center gap-1 md:gap-2">
                   <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 rounded-xl text-muted-foreground hover:text-purple-600 hover:bg-purple-50 transition-all"><Phone size={16} className="md:w-[18px] md:h-[18px]" /></Button>
                   <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 rounded-xl text-muted-foreground hover:text-purple-600 hover:bg-purple-50 transition-all"><Video size={16} className="md:w-[18px] md:h-[18px]" /></Button>
                   <Button variant="ghost" size="icon" onClick={() => { openChatDetail(); setShowInfo(false); }} className="hidden sm:flex h-8 w-8 md:h-10 md:w-10 rounded-xl text-muted-foreground hover:text-purple-600 hover:bg-purple-50" title="Chat details"><LayoutList size={16} className="md:w-[18px] md:h-[18px]" /></Button>
                   <Button variant="ghost" size="icon" onClick={() => setShowInfo(!showInfo)} className={cn("h-8 w-8 md:h-10 md:w-10 rounded-xl transition-all", showInfo ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30" : "text-muted-foreground hover:text-purple-600 hover:bg-purple-50")}><Info size={16} className="md:w-[18px] md:h-[18px]" /></Button>
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-purple-600 hover:bg-purple-50 transition-all">
                         <MoreVertical size={18} />
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2 shadow-2xl border-border/40 bg-background/95 backdrop-blur-md">
                       <div className="px-3 py-2 mb-1">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chat Options</p>
                       </div>
                       <DropdownMenuItem onClick={openChatDetail} className="gap-3 py-3 rounded-xl focus:bg-purple-50 focus:text-purple-600 cursor-pointer">
                         <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600"><LayoutList size={16} /></div>
                         <span className="font-bold">Chat details page</span>
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setShowInfo(true)} className="gap-3 py-3 rounded-xl focus:bg-purple-50 focus:text-purple-600 cursor-pointer">
                         <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><Info size={16} /></div>
                         <span className="font-bold">Quick info panel</span>
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setConfirmClearChat(true)} className="gap-3 py-3 rounded-xl focus:bg-purple-50 focus:text-purple-600 cursor-pointer">
                         <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><Eraser size={16} /></div>
                         <span className="font-bold">Clear chat</span>
                       </DropdownMenuItem>
                       {!activeChat?.isGroup && otherDmUser && (
                         <DropdownMenuItem onClick={() => setConfirmBlockUser(true)} className="gap-3 py-3 rounded-xl focus:bg-amber-50 focus:text-amber-700 cursor-pointer">
                           <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700"><Ban size={16} /></div>
                           <span className="font-bold">Block user</span>
                         </DropdownMenuItem>
                       )}
                       <DropdownMenuItem onClick={handleMute} className="gap-3 py-3 rounded-xl focus:bg-purple-50 focus:text-purple-600 cursor-pointer">
                         <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><BellOff size={16} /></div>
                         <span className="font-bold">Mute Notifications</span>
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={handleArchive} className="gap-3 py-3 rounded-xl focus:bg-purple-50 focus:text-purple-600 cursor-pointer">
                         <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><Archive size={16} /></div>
                         <span className="font-bold">Archive Chat</span>
                       </DropdownMenuItem>
                       <DropdownMenuSeparator className="my-2 opacity-50" />
                       <DropdownMenuItem onClick={() => setConfirmDeleteChat(true)} className="text-red-500 gap-3 py-3 rounded-xl focus:bg-red-50 focus:text-red-600 cursor-pointer">
                         <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600"><Trash2 size={16} /></div>
                         <span className="font-bold">Delete Chat</span>
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                 </div>
               </div>
              {/* Messages Area */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                  <MessageList
                    messages={messages}
                    userId={user?._id}
                    isLoading={loadingMessages}
                    isTyping={isTyping}
                    typingLabel={typingFrom}
                    onDeleteMessage={handleDeleteMessage}
                    onReplyMessage={(msg) => setReplyTo(msg)}
                    onEditMessage={handleEditMessage}
                    onReactMessage={handleReactMessage}
                    onPinMessage={handlePinMessage}
                    onForwardMessage={handleForwardMessage}
                    onMediaClick={(media) => setSelectedMedia(media)}
                  />

                  {/* Input Area */}
                  {replyTo && (
                    <div className="px-4 py-2 bg-purple-50 dark:bg-purple-950/30 border-t border-purple-100 dark:border-purple-900/50 flex items-center justify-between animate-in slide-in-from-bottom-2 shrink-0">
                      <div className="border-l-4 border-purple-500 pl-3">
                        <p className="text-[10px] font-bold text-purple-700 dark:text-purple-400">Replying to {replyTo.sender?.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setReplyTo(null)} className="h-6 w-6 hover:bg-purple-200 dark:hover:bg-purple-900">×</Button>
                    </div>
                  )}
                  <div className="shrink-0 border-t border-border/40 bg-background">
                    <MessageComposer
                      message={draft}
                      onMessageChange={setDraft}
                      onSend={handleSend}
                      onAttach={() => fileInputRef.current?.click()}
                      loading={isSending || sendMessageMutation.isPending}
                    />
                  </div>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const previews = files.map(f => ({ file: f, url: URL.createObjectURL(f) }));
                    setPreviewFiles(previews);
                  }} />
                </div>

                {/* Info Sidebar */}
                {showInfo && (
                  <div className="w-75 border-l border-border/50 bg-background hidden lg:flex flex-col animate-in slide-in-from-right duration-300">
                     <div className="p-6 flex flex-col items-center text-center border-b border-border/50">
                       <Avatar className="w-24 h-24 mb-4 border-4 border-purple-50">
                         <AvatarImage src={getChatAvatar(activeChat)} />
                         <AvatarFallback className="text-2xl">{getChatTitle(activeChat).substring(0,2).toUpperCase()}</AvatarFallback>
                       </Avatar>
                       <h3 className="font-bold text-lg">{getChatTitle(activeChat)}</h3>
                       <p className="text-sm text-muted-foreground">@{activeChat.isGroup ? 'Group' : 'Direct Message'}</p>
                     </div>
                      <ScrollArea className="flex-1 p-4 space-y-6">
                        <div>
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-3">Settings</h4>
                          <div className="space-y-1">
                            <Button variant="outline" onClick={openChatDetail} className="w-full justify-start gap-3 rounded-xl border-purple-200 font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-900 dark:text-purple-300"><LayoutList size={16} /> Full details &amp; stats</Button>
                            <Button variant="ghost" onClick={handleMute} className="w-full justify-start gap-3 rounded-xl"><BellOff size={16} /> Mute Notifications</Button>
                            <Button variant="ghost" onClick={handleArchive} className="w-full justify-start gap-3 rounded-xl"><Archive size={16} /> Archive Chat</Button>
                            <Button variant="ghost" onClick={() => setConfirmClearChat(true)} className="w-full justify-start gap-3 rounded-xl"><Eraser size={16} /> Clear Chat</Button>
                            {!activeChat?.isGroup && otherDmUser && (
                              <Button variant="ghost" onClick={() => setConfirmBlockUser(true)} className="w-full justify-start gap-3 rounded-xl text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"><Ban size={16} /> Block User</Button>
                            )}
                            <Button variant="ghost" onClick={() => setConfirmDeleteChat(true)} className="w-full justify-start gap-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950"><Trash2 size={16} /> Delete Conversation</Button>
                          </div>
                        </div>

                        {/* Media Section */}
                        {chatDetail?.media?.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                              <h4 className="text-[10px] font-bold text-muted-foreground uppercase">Photos & Videos</h4>
                              <span className="text-[10px] font-medium text-purple-600">{chatDetail.totalMediaFiles} items</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {chatDetail.media.slice(0, 6).map((item, idx) => (
                                <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-80 transition cursor-pointer group relative">
                                  <img src={item.url} alt="Shared media" className="w-full h-full object-cover" />
                                  {item.type === 'video' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                      <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                                        <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-white ml-0.5" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            {chatDetail.totalMediaFiles > 6 && (
                              <Button variant="link" className="w-full text-xs text-purple-600 h-8 mt-1">See all media</Button>
                            )}
                          </div>
                        )}

                        {/* Links Section */}
                        {chatDetail?.links?.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 px-1">Shared Links</h4>
                            <div className="space-y-2">
                              {chatDetail.links.slice(0, 4).map((link, idx) => (
                                <a 
                                  key={idx} 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition group"
                                >
                                  <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-100">
                                    <CornerUpRight size={14} className="text-purple-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate">{link.url.replace(/^https?:\/\/(www\.)?/, '')}</p>
                                  </div>
                                </a>
                              ))}
                            </div>
                            {chatDetail.totalLinks > 4 && (
                              <Button variant="link" className="w-full text-xs text-purple-600 h-8 mt-1">See all links</Button>
                            )}
                          </div>
                        )}

                        {activeChat.isGroup && (
                          <GroupMembersPanel
                            chat={activeChat}
                            currentUserId={user?._id}
                            contactsPool={contactsForGroup}
                            contactsLoading={
                              loadingFollowingContacts || loadingFollowersContacts
                            }
                            contactsError={
                              followingContactsError && followersContactsError
                                ? true
                                : null
                            }
                          />
                        )}
                     </ScrollArea>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/5">
              <MessageCircle size={64} className="text-purple-500 mb-4 opacity-20" />
              <h3 className="text-2xl font-bold mb-2">Your Conversations</h3>
              <p className="text-muted-foreground max-w-70">Select a chat or start a new conversation.</p>
              <Button className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-purple-500/20 transition-all active:scale-95">Start New Chat</Button>
            </div>
          )}
        </div>
        
        <CreateGroupModal
          open={showNewGroupModal}
          onClose={() => setShowNewGroupModal(false)}
          participants={contactsForGroup}
          participantsLoading={
            loadingFollowingContacts || loadingFollowersContacts
          }
          participantsError={
            followingContactsError && followersContactsError
              ? "Could not load your contacts. Try again."
              : null
          }
          onCreateGroup={async (formData) => {
            const res = await createGroupMutation.mutateAsync(formData);
            showToast({
              message: res?.message || "Group created",
              type: "success",
            });
          }}
        />

        <NewChatModal
          open={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
          contacts={contactsForGroup}
          contactsLoading={
            loadingFollowingContacts || loadingFollowersContacts
          }
          contactsError={
            followingContactsError && followersContactsError
              ? "Could not load your contacts. Try again."
              : null
          }
          onSelectUser={async (userId) => {
            const res = await createChatMutation.mutateAsync(userId);
            showToast({
              message: res?.message || "Chat opened",
              type: "success",
            });
          }}
        />

        {/* Forward Message Modal */}
        <ForwardMessageModal 
          open={showForwardModal} 
          onClose={() => {
            setShowForwardModal(false);
            setForwardingMessage(null);
          }}
          chats={chats}
          message={forwardingMessage}
          onForward={handleForwardToChats}
        />

        {/* Media Preview Modal */}
        {selectedMedia && (
          <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setSelectedMedia(null)}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-full z-50 transition-transform active:scale-90"
              onClick={() => setSelectedMedia(null)}
            >
              <X size={32} />
            </Button>
            
            <div className="w-full max-w-5xl h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
              {selectedMedia.type === 'video' ? (
                <div className="relative w-full max-h-[80vh] aspect-video">
                  <video 
                    src={selectedMedia.url} 
                    controls 
                    autoPlay 
                    className="w-full h-full rounded-2xl shadow-2xl ring-1 ring-white/10"
                  />
                </div>
              ) : (
                <img 
                  src={selectedMedia.url} 
                  alt="Media full size" 
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500 ring-1 ring-white/10" 
                />
              )}
            </div>
            
            <div className="mt-8 text-white/50 text-xs font-medium tracking-widest uppercase flex gap-6 items-center">
               <span className="flex items-center gap-2">
                 <Clock3 size={14} /> Shared {activeChat ? getChatTitle(activeChat) : 'Media'}
               </span>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <a 
                 href={selectedMedia.url} 
                 download 
                 target="_blank" 
                 rel="noreferrer"
                 className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
               >
                 <Paperclip size={14} /> Download Original
               </a>
            </div>
          </div>
        )}

        <AlertDialog open={confirmClearChat} onOpenChange={setConfirmClearChat}>
          <AlertDialogContent className="max-w-md rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Clear this chat?</AlertDialogTitle>
              <AlertDialogDescription>
                All messages will be hidden for you only. Others in the chat keep
                their copy of the history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-purple-600 hover:bg-purple-700"
                disabled={clearChatMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  void executeClearChat();
                }}
              >
                {clearChatMutation.isPending ? "Clearing…" : "Clear for me"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmBlockUser} onOpenChange={setConfirmBlockUser}>
          <AlertDialogContent className="max-w-md rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Block {otherDmUser?.username || "this user"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                They won&apos;t be able to message you. You can unblock later from
                settings or the block list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-amber-600 hover:bg-amber-700"
                disabled={toggleBlockMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  void executeBlockUser();
                }}
              >
                {toggleBlockMutation.isPending ? "Working…" : "Block"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmDeleteChat} onOpenChange={setConfirmDeleteChat}>
          <AlertDialogContent className="max-w-md rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the conversation from your inbox. You can&apos;t undo
                this from here.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-red-600 hover:bg-red-700"
                disabled={deleteChatMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  void executeDeleteChat();
                }}
              >
                {deleteChatMutation.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default Messages;
