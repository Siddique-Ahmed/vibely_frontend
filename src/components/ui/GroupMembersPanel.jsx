import React, { useMemo, useRef, useState } from "react";
import {
  UserPlus,
  MoreVertical,
  X,
  Search,
  Loader2,
  Check,
  UserCheck,
  UserX,
  ImagePlus,
  Camera,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { Badge } from "@/components/ui/badge";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
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
  useMakeAdmin,
  useRemoveAdmin,
  useRemoveMember,
  useAddGroupMembers,
  useApproveJoinRequest,
  useRejectJoinRequest,
  useUpdateGroupInfo,
} from "../../hooks/useApi";
import { showToast } from "../Toast";

function getChatActionError(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    "Something went wrong"
  );
}

function sameUser(a, b) {
  const id = (x) => String(x?._id ?? x ?? "");
  return id(a) === id(b) && id(a) !== "";
}

function roleBadge(roleLabel) {
  if (roleLabel === "Owner")
    return (
      <Badge variant="purple" className="shrink-0 text-[10px] font-bold uppercase tracking-wide">
        Owner
      </Badge>
    );
  if (roleLabel === "Admin")
    return (
      <Badge variant="default" className="shrink-0 bg-purple-600 text-[10px] font-bold uppercase tracking-wide">
        Admin
      </Badge>
    );
  if (roleLabel === "Moderator")
    return (
      <Badge variant="secondary" className="shrink-0 text-[10px] font-bold uppercase tracking-wide">
        Mod
      </Badge>
    );
  return (
    <Badge variant="outline" className="shrink-0 text-muted-foreground text-[10px] font-bold uppercase tracking-wide">
      Member
    </Badge>
  );
}

export function GroupMembersPanel({
  chat,
  currentUserId,
  contactsPool = [],
  contactsLoading = false,
  contactsError = null,
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const groupPhotoInputRef = useRef(null);
  const groupCoverInputRef = useRef(null);

  const groupId = chat?._id;
  const ownerId = String(chat?.groupAdmin?._id ?? chat?.groupAdmin ?? "");

  const makeAdminMutation = useMakeAdmin();
  const removeAdminMutation = useRemoveAdmin();
  const removeMemberMutation = useRemoveMember();
  const addMembersMutation = useAddGroupMembers();
  const approveMutation = useApproveJoinRequest();
  const rejectMutation = useRejectJoinRequest();
  const updateGroupMutation = useUpdateGroupInfo();

  const isCurrentUserAdmin = useMemo(() => {
    const me = String(currentUserId ?? "");
    if (!me || !chat?.isGroup) return false;
    if (ownerId && ownerId === me) return true;
    const entry = chat.members?.find((m) => String(m.user?._id ?? m.user) === me);
    return entry?.role === "admin";
  }, [chat, currentUserId, ownerId]);

  const memberRows = useMemo(() => {
    if (!chat?.participants?.length) return [];
    const memberByUserId = new Map();
    for (const m of chat.members || []) {
      const uid = String(m.user?._id ?? m.user ?? "");
      if (uid) memberByUserId.set(uid, m);
    }

    const rows = (chat.participants || []).map((p) => {
      const uid = String(p._id ?? p ?? "");
      const mEntry = memberByUserId.get(uid);
      const userObj = typeof p === "object" && p?._id ? p : null;
      return {
        userId: uid,
        user:
          userObj ||
          (typeof mEntry?.user === "object" && mEntry?.user?._id ? mEntry.user : null) ||
          { _id: uid, username: "Member", profile: {} },
        backendRole: mEntry?.role || "member",
      };
    });

    const rank = (r) => {
      if (ownerId && r.userId === ownerId) return 0;
      if (r.backendRole === "admin") return 1;
      if (r.backendRole === "moderator") return 2;
      return 3;
    };

    return rows.sort((a, b) => {
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      const ua = (a.user?.username || "").toLowerCase();
      const ub = (b.user?.username || "").toLowerCase();
      return ua.localeCompare(ub);
    });
  }, [chat, ownerId]);

  const pendingJoinRequests = useMemo(() => {
    const reqs = chat?.joinRequests || [];
    return reqs.filter((r) => r.status === "pending" && r.user);
  }, [chat?.joinRequests]);

  const participantIdSet = useMemo(() => {
    const s = new Set();
    for (const p of chat?.participants || []) {
      s.add(String(p._id ?? p));
    }
    return s;
  }, [chat?.participants]);

  const refreshBusy =
    makeAdminMutation.isPending ||
    removeAdminMutation.isPending ||
    removeMemberMutation.isPending ||
    addMembersMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    updateGroupMutation.isPending;

  const uploadGroupVisual = async (file, kind) => {
    if (!file?.size || !groupId) return;
    const fd = new FormData();
    if (kind === "photo") fd.append("groupImage", file);
    else fd.append("groupCoverImage", file);
    try {
      const res = await updateGroupMutation.mutateAsync({
        groupId,
        data: fd,
      });
      showToast({
        message:
          kind === "photo"
            ? res?.message || "Group photo updated"
            : res?.message || "Cover image updated",
        type: "success",
      });
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  if (!chat?.isGroup) return null;

  const resolveRoleLabel = (userIdStr, backendRole) => {
    if (ownerId && userIdStr === ownerId) return "Owner";
    if (backendRole === "admin") return "Admin";
    if (backendRole === "moderator") return "Moderator";
    return "Member";
  };

  const handlePromote = async (memberId) => {
    try {
      const res = await makeAdminMutation.mutateAsync({ groupId, memberId });
      showToast({
        message: res?.message || "Promoted to admin",
        type: "success",
      });
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const handleDemote = async (memberId) => {
    try {
      const res = await removeAdminMutation.mutateAsync({ groupId, memberId });
      showToast({
        message: res?.message || "Admin role removed",
        type: "success",
      });
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const handleRemoveConfirmed = async () => {
    if (!removeTarget?.id) return;
    try {
      const res = await removeMemberMutation.mutateAsync({
        groupId,
        memberId: removeTarget.id,
      });
      setRemoveTarget(null);
      showToast({
        message: res?.message || "Member removed",
        type: "success",
      });
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const handleApprove = async (requestUserId) => {
    try {
      const res = await approveMutation.mutateAsync({ groupId, requestUserId });
      showToast({
        message: res?.message || "Request approved",
        type: "success",
      });
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const handleReject = async (requestUserId) => {
    try {
      const res = await rejectMutation.mutateAsync({ groupId, requestUserId });
      showToast({
        message: res?.message || "Request declined",
        type: "success",
      });
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  return (
    <div className="space-y-4">
      {isCurrentUserAdmin && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/15 shadow-sm">
          <div className="relative isolate h-[5.75rem] w-full bg-gradient-to-br from-purple-200/90 via-purple-100 to-muted dark:from-purple-950 dark:via-purple-950/70 dark:to-background">
            {chat.groupCoverImage ? (
              <img
                src={chat.groupCoverImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent dark:from-black/50 dark:to-transparent pointer-events-none" />
            <input
              ref={groupCoverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadGroupVisual(f, "cover");
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={refreshBusy}
              className="absolute bottom-2 right-2 gap-1.5 rounded-xl text-[11px] shadow-md"
              onClick={() => groupCoverInputRef.current?.click()}
            >
              <ImagePlus size={14} aria-hidden /> Cover
            </Button>
          </div>

          <div className="relative flex flex-col items-center px-4 pb-4 pt-2">
            <input
              ref={groupPhotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadGroupVisual(f, "photo");
              }}
            />
            <div className="relative z-[1] -mt-11">
              <Avatar className="h-[4.75rem] w-[4.75rem] border-[3px] border-background shadow-lg ring-2 ring-purple-200/70 dark:ring-purple-900/60">
                <AvatarImage src={chat.groupImage} />
                <AvatarFallback className="text-lg font-bold">
                  {(chat.groupName || "GP").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={refreshBusy}
                className="absolute -bottom-0.5 -right-0.5 size-9 rounded-full border border-border/70 shadow-md"
                onClick={() => groupPhotoInputRef.current?.click()}
                aria-label="Change group photo"
              >
                <Camera size={16} aria-hidden />
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              JPG, PNG or WebP · max ~5&nbsp;MB each
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 px-1">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Members
          </h4>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Owner and admins can add people, approve requests, and manage roles.
          </p>
        </div>
        {isCurrentUserAdmin && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-2 rounded-xl text-xs"
            onClick={() => setAddOpen(true)}
            disabled={refreshBusy}
          >
            <UserPlus size={14} /> Add
          </Button>
        )}
      </div>

      {chat.groupPrivacy === "approval_required" && pendingJoinRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/25">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">
            Pending join requests
          </p>
          <ul className="space-y-2">
            {pendingJoinRequests.map((jr) => {
              const ru = jr.user;
              const rid = String(ru?._id ?? jr.user ?? "");
              return (
                <li
                  key={rid}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/80 px-2 py-1.5"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={ru?.profile?.profile_picture} />
                    <AvatarFallback className="text-[10px]">
                      {(ru?.username || "?").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {ru?.username || "User"}
                  </span>
                  {isCurrentUserAdmin && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg text-green-700 hover:bg-green-100 dark:hover:bg-green-950/40"
                        disabled={refreshBusy}
                        onClick={() => void handleApprove(rid)}
                        aria-label="Approve"
                      >
                        <UserCheck size={16} />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-950/40"
                        disabled={refreshBusy}
                        onClick={() => void handleReject(rid)}
                        aria-label="Decline"
                      >
                        <UserX size={16} />
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ul className="space-y-1">
        {memberRows.map((row) => {
          const uid = row.userId;
          const rl = resolveRoleLabel(uid, row.backendRole);
          const isOwnerRow = rl === "Owner";
          const isSelf = String(currentUserId) === uid;
          const canModerateRow =
            isCurrentUserAdmin && !isOwnerRow && !isSelf && groupId;

          const showPromote =
            canModerateRow && (row.backendRole === "member" || row.backendRole === "moderator");
          const showDemote = canModerateRow && row.backendRole === "admin" && !isOwnerRow;
          const showRemove = canModerateRow;

          return (
            <li
              key={uid}
              className="flex items-center gap-2 rounded-xl px-1 py-1.5 transition hover:bg-muted/50"
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={row.user?.profile?.profile_picture} />
                <AvatarFallback className="text-xs">
                  {(row.user?.username || "?").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">
                  {row.user?.profile?.full_name || row.user?.username || "Member"}
                  {isSelf && (
                    <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                      you
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  @{row.user?.username || "—"}
                </p>
              </div>
              {roleBadge(rl)}
              {(showPromote || showDemote || showRemove) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 rounded-lg"
                      disabled={refreshBusy}
                      aria-label="Member actions"
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    {showPromote && (
                      <DropdownMenuItem
                        className="rounded-lg"
                        onSelect={() => void handlePromote(uid)}
                      >
                        Make admin
                      </DropdownMenuItem>
                    )}
                    {showDemote && (
                      <DropdownMenuItem
                        className="rounded-lg"
                        onSelect={() => void handleDemote(uid)}
                      >
                        Remove as admin
                      </DropdownMenuItem>
                    )}
                    {(showPromote || showDemote) && showRemove && <DropdownMenuSeparator />}
                    {showRemove && (
                      <DropdownMenuItem
                        className="rounded-lg text-red-600 focus:text-red-600"
                        onSelect={() =>
                          setRemoveTarget({
                            id: uid,
                            name: row.user?.username || "this member",
                          })
                        }
                      >
                        Remove from group
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          );
        })}
      </ul>

      {addOpen && (
        <AddGroupMembersOverlay
          groupId={groupId}
          participantIdSet={participantIdSet}
          contactsPool={contactsPool}
          contactsLoading={contactsLoading}
          contactsError={contactsError}
          mutation={addMembersMutation}
          onClose={() => setAddOpen(false)}
        />
      )}

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.name}? </AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this group chat. This does not delete their messages from
              the history unless you manage that separately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 hover:bg-red-700"
              disabled={removeMemberMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleRemoveConfirmed();
              }}
            >
              {removeMemberMutation.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AddGroupMembersOverlay({
  groupId,
  participantIdSet,
  contactsPool,
  contactsLoading,
  contactsError,
  mutation,
  onClose,
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  const available = useMemo(() => {
    return (contactsPool || []).filter((p) => {
      const id = String(p?._id ?? "");
      if (!id || participantIdSet.has(id)) return false;
      return true;
    });
  }, [contactsPool, participantIdSet]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter((p) => {
      const u = (p?.username ?? "").toLowerCase();
      const fn = (p?.profile?.full_name ?? "").toLowerCase();
      return u.includes(q) || fn.includes(q);
    });
  }, [available, search]);

  const toggle = (u) => {
    setSelected((prev) =>
      prev.some((x) => sameUser(x, u)) ? prev.filter((x) => !sameUser(x, u)) : [...prev, u],
    );
  };

  const submit = async () => {
    if (selected.length === 0) {
      showToast({ message: "Select at least one person", type: "warning" });
      return;
    }
    try {
      const res = await mutation.mutateAsync({
        groupId,
        memberIds: selected.map((p) => p._id),
      });
      showToast({
        message: res?.message || "Members added",
        type: "success",
      });
      onClose();
    } catch (e) {
      showToast({ message: getChatActionError(e), type: "error" });
    }
  };

  const emptyReady = !contactsLoading && !contactsError && available.length === 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-labelledby="add-members-title"
        aria-modal="true"
        className={cn(
          "flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border/60 bg-background shadow-2xl",
          "max-h-[min(92dvh,640px)] animate-in zoom-in-95 duration-200",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/50 bg-muted/25 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="add-members-title" className="text-lg font-bold tracking-tight">
              Add members
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose people from your followers or following who are not already in this group.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={mutation.isPending}
            className="size-10 shrink-0 rounded-full"
            aria-label="Close"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="max-h-[calc(min(92dvh,640px)-8.5rem)] min-h-[200px] overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
          <div className="relative mb-3">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-10 rounded-xl pl-9"
              disabled={mutation.isPending}
            />
          </div>

          {contactsError && (
            <p className="text-sm text-red-600">Could not load contacts. Try again later.</p>
          )}

          {contactsLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Loading contacts…</span>
            </div>
          )}

          {emptyReady && !contactsLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No one left to add from your network, or everyone is already in the group.
            </p>
          )}

          {!contactsLoading && !contactsError && filtered.length > 0 && (
            <ul className="space-y-1">
              {filtered.map((p) => {
                const isOn = selected.some((s) => sameUser(s, p));
                return (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => toggle(p)}
                      disabled={mutation.isPending}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-left transition",
                        isOn
                          ? "border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/30"
                          : "hover:bg-muted/70",
                      )}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={p.profile?.profile_picture} />
                        <AvatarFallback className="text-xs">
                          {(p.username || "?").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.username}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.profile?.full_name || "—"}
                        </p>
                      </div>
                      {isOn && <Check className="size-5 shrink-0 text-purple-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/50 px-5 py-3 sm:px-6">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl bg-purple-600 hover:bg-purple-700"
            disabled={mutation.isPending || selected.length === 0}
            onClick={() => void submit()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Adding…
              </>
            ) : (
              `Add ${selected.length} member${selected.length === 1 ? "" : "s"}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
