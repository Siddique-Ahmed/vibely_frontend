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
import AvatarCustom from "../components/Avatar";
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
    <MainLayout sidebar={<Sidebar />} topbar={<Topbar />} hideBottomNav={true}>
      <div className="flex flex-col h-[calc(100vh-60px)] bg-slate-50/30 dark:bg-slate-950/20">
        {/* Header */}
        <div className="px-4 md:px-6 py-3 md:py-8 border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/messages")}
                className="h-9 w-9 md:h-11 md:w-11 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 transition-colors"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg md:text-3xl font-black tracking-tight flex items-center gap-2 md:gap-3 truncate">
                  Archive <Badge variant="secondary" className="rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 border-none px-2 md:px-3 text-[10px] md:text-sm">{archivedChats.length}</Badge>
                </h1>
                <p className="hidden md:block text-sm text-muted-foreground mt-1 font-medium">Conversations you've tucked away</p>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl md:rounded-2xl border border-purple-100/50 dark:border-purple-900/30 shrink-0">
              <Inbox size={14} className="text-purple-600 md:w-4 md:h-4" />
              <span className="text-[9px] md:text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest">Archived</span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-5xl mx-auto p-3 md:p-6">
            {isLoading ? (
              <div className="grid gap-3 md:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 md:h-24 bg-muted/40 animate-pulse rounded-2xl md:rounded-3xl" />
                ))}
              </div>
            ) : archivedChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center px-4">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-purple-50 dark:bg-purple-900/10 rounded-full flex items-center justify-center mb-6">
                  <Archive size={32} className="text-purple-300 dark:text-purple-700" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">No archived chats</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">Your archive is currently empty. Any chats you archive will appear here.</p>
                <Button 
                  onClick={() => navigate("/messages")} 
                  variant="outline" 
                  className="mt-8 rounded-full border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  Return to Messages
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:gap-4">
                {archivedChats.map((chat) => (
                  <div 
                    key={chat._id}
                    onClick={() => navigate(`/messages?chatId=${chat._id}`)}
                    className="group relative bg-background hover:bg-slate-50 dark:hover:bg-slate-900/40 border border-border/40 rounded-2xl md:rounded-3xl p-3 md:p-5 flex items-center gap-3 md:gap-5 transition-all duration-300 hover:shadow-lg dark:hover:shadow-purple-500/5 cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <AvatarCustom
                        profilePicture={getChatAvatar(chat)}
                        fullName={getChatTitle(chat)}
                        username={getChatTitle(chat)}
                        size="lg"
                        className="h-12 w-12 md:h-16 md:w-16 border-2 border-white dark:border-slate-800 shadow-sm"
                      />
                      {chat.isGroup && (
                        <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-1 rounded-lg border-2 border-background">
                          <MessageSquare size={10} className="md:w-3 md:h-3" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm md:text-lg truncate group-hover:text-purple-600 transition-colors">
                          {getChatTitle(chat)}
                        </h3>
                        {chat.isGroup && <Badge variant="outline" className="text-[8px] md:text-[9px] uppercase tracking-tighter py-0 px-1">Group</Badge>}
                      </div>
                      <p className="text-[11px] md:text-sm text-muted-foreground italic opacity-70 truncate mb-1">
                        {chat.lastMessage?.content || "No messages yet"}
                      </p>
                      <div className="flex items-center gap-1 text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">
                         <Clock size={10} className="md:w-3 md:h-3" />
                         {new Date(chat.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div 
                      className="flex items-center gap-1 md:gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 md:translate-x-4 md:group-hover:translate-x-0 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleUnarchive(chat._id)}
                        className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                        title="Unarchive"
                      >
                        <Inbox size={15} className="md:w-[18px] md:h-[18px]" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        title="Delete"
                        onClick={() => {
                          if (!window.confirm("Delete this chat permanently?")) return;
                          deleteMutation.mutate(chat._id, {
                            onSuccess: () => {
                              queryClient.invalidateQueries({ queryKey: ["archivedChats"] });
                              queryClient.invalidateQueries({ queryKey: ["chats"] });
                              showToast({ message: "Chat deleted", type: "success" });
                            },
                            onError: (e) => showToast({ message: getChatActionError(e), type: "error" }),
                          });
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={15} className="md:w-[18px] md:h-[18px]" />
                      </Button>
                      <Button 
                        className="hidden md:flex rounded-xl bg-purple-600 text-white hover:bg-purple-700 px-6 font-bold text-sm h-10"
                        onClick={() => navigate(`/messages?chatId=${chat._id}`)}
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
