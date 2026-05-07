import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Archive,
  Ban,
  Eraser,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  Trash2,
  Video,
  Users,
  ExternalLink,
  Paperclip,
} from "lucide-react";
import MainLayout from "../components/layouts/MainLayout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
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
import {
  useSingleChat,
  useChatDetail,
  useToggleBlock,
  useArchiveChat,
  useClearChat,
  useDeleteChat,
  useFollowing,
  useFollowers,
} from "../hooks/useApi";
import { GroupMembersPanel } from "../components/ui/GroupMembersPanel";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import { showToast } from "../components/Toast";

function getChatActionError(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    "Something went wrong"
  );
}

function StatTile({ icon: Icon, label, value, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border/50 bg-background/80 p-4 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
        {value ?? 0}
      </p>
    </div>
  );
}

export default function ChatDetail() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);

  const {
    data: followingResp,
    isFetching: loadingFollowingContacts,
    isError: followingContactsError,
  } = useFollowing(1, 50);
  const {
    data: followersResp,
    isFetching: loadingFollowersContacts,
    isError: followersContactsError,
  } = useFollowers(1, 50);

  const contactsForGroup = useMemo(() => {
    const fromFollowing = followingResp?.data?.following ?? [];
    const fromFollowers = followersResp?.data?.followers ?? [];
    const map = new Map();
    for (const u of [...fromFollowing, ...fromFollowers]) {
      if (!u?._id) continue;
      if (String(u._id) === String(user?._id)) continue;
      map.set(String(u._id), u);
    }
    return [...map.values()];
  }, [
    followingResp?.data?.following,
    followersResp?.data?.followers,
    user?._id,
  ]);

  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);

  const { data: singleResp, isLoading: loadingChat } = useSingleChat(chatId);
  const { data: detailResp, isLoading: loadingDetail } = useChatDetail(chatId);

  const chat = singleResp?.data?.chat;
  const detail = detailResp?.data?.detail;

  const toggleBlockMutation = useToggleBlock();
  const archiveMutation = useArchiveChat();
  const clearMutation = useClearChat();
  const deleteMutation = useDeleteChat();

  const getChatTitle = (c) => {
    if (!c) return "Chat";
    if (c.isGroup) return c.groupName || "Group chat";
    const other = c.participants?.find(
      (p) => String(p._id) !== String(user?._id),
    );
    return other?.username || other?.profile?.full_name || "Friend";
  };

  const getChatAvatar = (c) => {
    if (!c) return null;
    if (c.isGroup && c.groupImage) return c.groupImage;
    const other =
      c.participants?.find((p) => String(p._id) !== String(user?._id)) ||
      c.participants?.[0];
    return other?.profile?.profile_picture;
  };

  const otherUser = chat?.participants?.find(
    (p) => String(p._id) !== String(user?._id),
  );

  const handleArchive = async () => {
    if (!chatId) return;
    try {
      const res = await archiveMutation.mutateAsync(chatId);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["archivedChats"] });
      showToast({
        message: res?.message || "Chat archived",
        type: "success",
      });
      navigate("/messages");
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const handleClear = async () => {
    if (!chatId) return;
    try {
      const res = await clearMutation.mutateAsync(chatId);
      setConfirmClear(false);
      queryClient.invalidateQueries({ queryKey: ["chatDetail", chatId] });
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      showToast({
        message: res?.message || "Chat cleared for you",
        type: "success",
      });
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!chatId) return;
    try {
      const res = await deleteMutation.mutateAsync(chatId);
      setConfirmDelete(false);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      showToast({
        message: res?.message || "Chat deleted",
        type: "success",
      });
      navigate("/messages");
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const handleBlock = async () => {
    if (!otherUser?._id) return;
    try {
      const res = await toggleBlockMutation.mutateAsync(otherUser._id);
      setConfirmBlock(false);
      showToast({
        message:
          res?.message || res?.data?.message || "Block status updated",
        type: "success",
      });
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  if (!chatId) {
    return (
      <MainLayout sidebar={<Sidebar />} topbar={<Topbar />}>
        <div className="p-8 text-center text-muted-foreground">Invalid chat.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout sidebar={<Sidebar />} topbar={<Topbar />} hideBottomNav={true}>
      <div className="flex min-h-[calc(100vh-60px)] flex-col bg-muted/15 md:min-h-[calc(100vh-60px)]">
        <div className="sticky top-0 z-10 border-b border-border/40 bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-5 md:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-black tracking-tight md:text-2xl">
                Chat details
              </h1>
              <p className="text-xs text-muted-foreground">
                Media, links, and conversation actions
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-6">
            {(loadingChat && !chat) || (loadingDetail && !detail) ? (
              <div className="space-y-6">
                <div className="h-32 animate-pulse rounded-3xl bg-muted" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <section className="overflow-hidden rounded-3xl border border-border/50 bg-linear-to-br from-purple-600/95 to-indigo-700 p-8 text-white shadow-xl shadow-purple-500/25">
                  <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                    <Avatar className="h-24 w-24 border-4 border-white/25 shadow-lg">
                      <AvatarImage src={getChatAvatar(chat)} />
                      <AvatarFallback className="bg-white/15 text-xl font-bold">
                        {getChatTitle(chat).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <h2 className="truncate text-2xl font-black">
                          {getChatTitle(chat)}
                        </h2>
                        {chat?.isGroup && (
                          <Badge className="border-0 bg-white/20 uppercase">
                            Group
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-white/85">
                        {chat?.isGroup
                          ? `${chat?.participants?.length ?? 0} participants`
                          : otherUser?.username
                            ? `@${otherUser.username}`
                            : "Direct message"}
                      </p>
                      <Button
                        variant="secondary"
                        className="mt-5 rounded-xl font-bold shadow-md"
                        onClick={() =>
                          navigate(
                            `/messages${chatId ? `?chatId=${chatId}` : ""}`,
                          )
                        }
                      >
                        Open chat
                      </Button>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Conversation stats
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile
                      icon={MessageSquare}
                      label="Messages"
                      value={detail?.totalMessages}
                    />
                    <StatTile
                      icon={Paperclip}
                      label="Media files"
                      value={detail?.totalMediaFiles}
                    />
                    <StatTile
                      icon={ImageIcon}
                      label="Images"
                      value={detail?.totalImageFiles}
                    />
                    <StatTile
                      icon={Video}
                      label="Videos"
                      value={detail?.totalVideoFiles}
                    />
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <StatTile
                      icon={Link2}
                      label="Links shared"
                      value={detail?.totalLinks}
                    />
                    <StatTile
                      icon={MessageSquare}
                      label="Msgs with links"
                      value={detail?.totalLinkMessages}
                    />
                  </div>
                </section>

                {(detail?.media?.length > 0 || detail?.links?.length > 0) && (
                  <section className="grid gap-8 lg:grid-cols-2">
                    {detail?.media?.length > 0 && (
                      <div className="rounded-3xl border border-border/50 bg-background p-6 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold">
                          <ImageIcon className="h-4 w-4 text-purple-600" />{" "}
                          Shared media
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {detail.media.slice(0, 12).map((item, idx) => (
                            <a
                              key={`${item.url}-${idx}`}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-square overflow-hidden rounded-xl bg-muted ring-1 ring-border/40 transition hover:opacity-90"
                            >
                              {item.type === "video" ? (
                                <div className="flex h-full w-full items-center justify-center bg-slate-900 text-[10px] font-bold text-white">
                                  Video
                                </div>
                              ) : (
                                <img
                                  src={item.url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {detail?.links?.length > 0 && (
                      <div className="rounded-3xl border border-border/50 bg-background p-6 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold">
                          <Link2 className="h-4 w-4 text-purple-600" /> Links
                        </h4>
                        <ul className="space-y-2">
                          {detail.links.slice(0, 20).map((link, idx) => (
                            <li key={`${link.url}-${idx}`}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-xl border border-border/40 px-3 py-2 text-sm transition hover:bg-muted/60"
                              >
                                <ExternalLink className="h-4 w-4 shrink-0 text-purple-600" />
                                <span className="min-w-0 flex-1 truncate font-medium">
                                  {link.url.replace(/^https?:\/\/(www\.)?/, "")}
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                )}

                {chat?.isGroup && chat?.participants?.length > 0 && (
                  <section className="rounded-3xl border border-border/50 bg-background p-6 shadow-sm">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-bold">
                      <Users className="h-4 w-4 text-purple-600" /> Group &amp; roles
                    </h4>
                    <GroupMembersPanel
                      chat={chat}
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
                  </section>
                )}

                <section className="rounded-3xl border border-border/50 bg-background p-6 shadow-sm">
                  <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Actions
                  </h3>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      variant="outline"
                      className="justify-start gap-2 rounded-xl font-semibold"
                      onClick={handleArchive}
                      disabled={archiveMutation.isPending}
                    >
                      <Archive className="h-4 w-4" /> Archive chat
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2 rounded-xl font-semibold"
                      onClick={() => setConfirmClear(true)}
                      disabled={clearMutation.isPending}
                    >
                      <Eraser className="h-4 w-4" /> Clear chat
                    </Button>
                    {!chat?.isGroup && otherUser?._id && (
                      <Button
                        variant="outline"
                        className="justify-start gap-2 rounded-xl font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
                        onClick={() => setConfirmBlock(true)}
                        disabled={toggleBlockMutation.isPending}
                      >
                        <Ban className="h-4 w-4" /> Block user
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      className="justify-start gap-2 rounded-xl font-semibold"
                      onClick={() => setConfirmDelete(true)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" /> Delete chat
                    </Button>
                  </div>
                </section>
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              All messages will be hidden for you only. Other people in the chat
              will still see them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-purple-600 hover:bg-purple-700"
              disabled={clearMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleClear();
              }}
            >
              {clearMutation.isPending ? "Clearing…" : "Clear for me"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the conversation from your list. This cannot be
              undone here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmBlock} onOpenChange={setConfirmBlock}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Block {otherUser?.username || "this user"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They won&apos;t be able to message you, and chat creation may be
              limited. You can unblock later from your settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-amber-600 hover:bg-amber-700"
              disabled={toggleBlockMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleBlock();
              }}
            >
              {toggleBlockMutation.isPending ? "Working…" : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
