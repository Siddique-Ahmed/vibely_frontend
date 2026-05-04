import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Archive, MessageSquare, Trash2, Clock, Inbox } from "lucide-react";
import { useArchivedChats, useArchiveChat, useDeleteChat } from "../hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import MainLayout from "../components/layouts/MainLayout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import { useSelector } from "react-redux";
import { showToast } from "../components/Toast";

function getChatActionError(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong"
  );
}

const ArchivedChats = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { data: archivedResponse, isLoading } = useArchivedChats(1, 50);
  const archivedChats = archivedResponse?.data?.chats || [];

  const unarchiveMutation = useArchiveChat();
  const deleteMutation = useDeleteChat();

  const handleUnarchive = (chatId) => {
    unarchiveMutation.mutate(chatId, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["archivedChats"] });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        showToast({
          message: res?.message || "Chat moved to your inbox",
          type: "success",
        });
      },
      onError: (e) =>
        showToast({ message: getChatActionError(e), type: "error" }),
    });
  };

  const getChatTitle = (chat) => {
    if (!chat) return "Chat";
    if (chat.isGroup) return chat.groupName || "Unnamed Group";
    const other = chat.participants?.find(
      (p) => String(p._id) !== String(user?._id),
    );
    return other?.username || "Vibely User";
  };

  const getChatAvatar = (chat) => {
    if (!chat) return null;
    if (chat.isGroup) return chat.groupImage;
    const other = chat.participants?.find(
      (p) => String(p._id) !== String(user?._id),
    );
    return other?.profile?.profile_picture;
  };

  return (
    <MainLayout sidebar={<Sidebar />} topbar={<Topbar />}>
      <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50/50 dark:bg-slate-950/20">
        {/* Header */}
        <div className="px-6 py-8 border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/messages")}
                className="rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 transition-colors"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  Archive <Badge variant="secondary" className="rounded-full bg-purple-100 text-purple-700 hover:bg-purple-100">{archivedChats.length}</Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Conversations you've tucked away</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100/50 dark:border-purple-900/30">
              <Inbox size={16} className="text-purple-600" />
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest">Archived Inbox</span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-5xl mx-auto p-6">
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-3xl" />
                ))}
              </div>
            ) : archivedChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-full flex items-center justify-center mb-6">
                  <Archive size={40} className="text-purple-200 dark:text-purple-800" />
                </div>
                <h3 className="text-xl font-bold">No archived chats</h3>
                <p className="text-muted-foreground mt-2 max-w-xs">Your archive is currently empty. Any chats you archive will appear here.</p>
                <Button 
                  onClick={() => navigate("/messages")} 
                  variant="outline" 
                  className="mt-8 rounded-full border-purple-200 hover:bg-purple-50"
                >
                  Return to Messages
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {archivedChats.map((chat) => (
                  <div 
                    key={chat._id}
                    className="group bg-background hover:bg-slate-50 dark:hover:bg-slate-900/40 border border-border/40 rounded-3xl p-5 flex items-center gap-5 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-0.5"
                  >
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-800 shadow-sm">
                        <AvatarImage src={getChatAvatar(chat)} />
                        <AvatarFallback className="text-lg bg-linear-to-br from-purple-100 to-indigo-100 text-purple-700 font-bold">
                          {getChatTitle(chat).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {chat.isGroup && (
                        <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-1 rounded-lg border-2 border-background">
                          <MessageSquare size={12} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg truncate group-hover:text-purple-600 transition-colors">
                          {getChatTitle(chat)}
                        </h3>
                        {chat.isGroup && <Badge variant="outline" className="text-[9px] uppercase tracking-tighter py-0">Group</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                        <p className="truncate flex-1 italic opacity-80">
                          {chat.lastMessage?.content || "No messages yet"}
                        </p>
                        <div className="flex items-center gap-1 shrink-0 text-[10px] uppercase tracking-widest opacity-60">
                           <Clock size={12} />
                           {new Date(chat.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); handleUnarchive(chat._id); }}
                        className="rounded-2xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white"
                        title="Unarchive"
                      >
                        <Inbox size={18} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!window.confirm("Delete this chat from your account?")) return;
                          deleteMutation.mutate(chat._id, {
                            onSuccess: (res) => {
                              queryClient.invalidateQueries({ queryKey: ["archivedChats"] });
                              queryClient.invalidateQueries({ queryKey: ["chats"] });
                              showToast({
                                message: res?.message || "Chat deleted",
                                type: "success",
                              });
                            },
                            onError: (e) =>
                              showToast({
                                message: getChatActionError(e),
                                type: "error",
                              }),
                          });
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={18} />
                      </Button>
                      <Button 
                        onClick={() => navigate(`/messages?chatId=${chat._id}`)}
                        className="rounded-2xl bg-purple-600 text-white hover:bg-purple-700 px-6 font-bold"
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </MainLayout>
  );
};

export default ArchivedChats;
