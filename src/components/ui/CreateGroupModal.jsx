import React, { useMemo, useState, useEffect } from "react";
import {
  X,
  Users,
  Check,
  Loader2,
  Search,
  UserRound,
  ChevronDown,
  ImagePlus,
} from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import AvatarCustom from "../Avatar";
import { cn } from "../../lib/utils";
import { showToast } from "../Toast";

function getChatActionError(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    "Something went wrong"
  );
}

function sameParticipant(a, b) {
  const id = (x) => String(x?._id ?? x ?? "");
  return id(a) === id(b) && id(a) !== "";
}

const PRIVACY = [
  { value: "public", label: "Public — invite freely" },
  { value: "private_link", label: "Private link only" },
  { value: "approval_required", label: "Approve join requests" },
];

export function CreateGroupModal({
  open,
  onClose,
  participants = [],
  participantsLoading = false,
  participantsError = null,
  onCreateGroup,
}) {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [groupImage, setGroupImage] = useState(null);
  const [groupCoverImage, setGroupCoverImage] = useState(null);
  const [groupPrivacy, setGroupPrivacy] = useState("public");
  const [participantSearch, setParticipantSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setParticipantSearch("");
  }, [open]);

  const filteredParticipants = useMemo(() => {
    const q = participantSearch.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) => {
      const u = (p?.username ?? "").toLowerCase();
      const fn = (p?.profile?.full_name ?? "").toLowerCase();
      const em = (p?.email ?? "").toLowerCase();
      return u.includes(q) || fn.includes(q) || em.includes(q);
    });
  }, [participants, participantSearch]);

  const toggleParticipant = (participant) => {
    setSelectedParticipants((prev) =>
      prev.some((p) => sameParticipant(p, participant))
        ? prev.filter((p) => !sameParticipant(p, participant))
        : [...prev, participant],
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showToast({ message: "Add a group name", type: "warning" });
      return;
    }
    if (selectedParticipants.length === 0) {
      showToast({
        message: "Select at least one person from your followers or following",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("groupName", groupName.trim());
      formData.append("groupDescription", groupDescription.trim());
      formData.append("groupPrivacy", groupPrivacy);
      formData.append(
        "memberIds",
        JSON.stringify(selectedParticipants.map((p) => p._id)),
      );

      if (groupImage) formData.append("groupImage", groupImage);
      if (groupCoverImage) formData.append("groupCoverImage", groupCoverImage);

      await onCreateGroup(formData);

      setGroupName("");
      setGroupDescription("");
      setSelectedParticipants([]);
      setGroupImage(null);
      setGroupCoverImage(null);
      setGroupPrivacy("public");
      setParticipantSearch("");
      onClose();
    } catch (error) {
      showToast({
        message: getChatActionError(error),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  if (!open) return null;

  const contactsEmptyReady =
    !participantsLoading && !participantsError && participants.length === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-labelledby="create-group-title"
        aria-modal="true"
        className={cn(
          "flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border/60 bg-background shadow-2xl",
          "max-h-[min(92dvh,720px)] animate-in zoom-in-95 duration-200 motion-reduce:animate-none",
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/50 bg-muted/25 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="create-group-title"
              className="text-lg font-bold tracking-tight sm:text-xl"
            >
              Create group chat
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Name the group and pick members from{" "}
              <span className="font-semibold text-foreground/85">following</span>{" "}
              or{" "}
              <span className="font-semibold text-foreground/85">followers</span>.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={loading}
            className="size-10 shrink-0 rounded-full hover:bg-muted"
            aria-label="Close"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Scrollable body — capped height so it always scrolls on small screens (flex + max-height alone often fails) */}
        <div className="max-h-[calc(min(92dvh,720px)-10.75rem)] min-h-[220px] overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="cg-name"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Group name
                </label>
                <Input
                  id="cg-name"
                  placeholder="e.g. Weekend plans"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="h-11 rounded-xl text-base"
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              {/* Participants first — stays visible above the fold on most screens */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Add participants
                  </label>
                  <span className="text-sm font-bold tabular-nums text-purple-600">
                    {selectedParticipants.length} selected
                  </span>
                </div>
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    placeholder="Search by name..."
                    disabled={loading || participantsLoading}
                    className="h-10 rounded-xl bg-muted/40 pl-9 text-sm"
                    autoComplete="off"
                  />
                </div>

                <div className="flex max-h-[min(220px,40vh)] flex-col overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-inner">
                  <div className="min-h-0 flex-1 overflow-y-auto p-2">
                    {participantsError ? (
                      <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
                        <p className="text-sm font-medium text-destructive">
                          {participantsError}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Refresh or try again in a moment.
                        </p>
                      </div>
                    ) : participantsLoading ? (
                      <div className="space-y-2 p-1">
                        {[1, 2, 3, 4].map((k) => (
                          <div
                            key={k}
                            className="flex animate-pulse items-center gap-3 rounded-xl p-3"
                          >
                            <div className="size-10 rounded-full bg-muted" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-1/3 rounded bg-muted-foreground/20" />
                              <div className="h-2.5 w-2/3 rounded bg-muted-foreground/15" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : contactsEmptyReady ? (
                      <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
                        <UserRound
                          size={32}
                          className="text-muted-foreground/40"
                          strokeWidth={1.25}
                          aria-hidden
                        />
                        <p className="text-sm font-semibold">No people yet</p>
                        <p className="max-w-[280px] text-xs leading-relaxed text-muted-foreground">
                          Follow people on Vibely (or gain followers); they&apos;ll show
                          up here—up to 50 from each list.
                        </p>
                      </div>
                    ) : filteredParticipants.length === 0 ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        No matches for{" "}
                        <span className="font-medium">{participantSearch.trim()}</span>
                      </p>
                    ) : (
                      filteredParticipants.map((participant) => {
                        const selected = selectedParticipants.some((p) =>
                          sameParticipant(p, participant),
                        );
                        return (
                          <button
                            type="button"
                            key={String(participant._id)}
                            onClick={() =>
                              !loading && toggleParticipant(participant)
                            }
                            disabled={loading}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
                              selected
                                ? "bg-purple-100 ring-2 ring-purple-400/60 dark:bg-purple-950/40"
                                : "hover:bg-background/95",
                            )}
                          >
                            <AvatarCustom
                              profilePicture={participant.profile?.profile_picture}
                              fullName={participant.profile?.full_name}
                              username={participant.username}
                              size="md"
                              className="size-11 border border-border/60 shadow-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {participant.username ||
                                  participant.profile?.full_name ||
                                  "User"}
                              </p>
                              {participant.profile?.full_name &&
                                participant.username && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {participant.profile.full_name}
                                  </p>
                                )}
                            </div>
                            <div className="shrink-0">
                              {selected ? (
                                <span className="flex size-8 items-center justify-center rounded-full bg-purple-600 text-white">
                                  <Check size={16} strokeWidth={3} aria-hidden />
                                </span>
                              ) : (
                                <span className="block size-8 rounded-full border-2 border-dashed border-border bg-background" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Privacy + description compact */}
                <div className="pt-2">
                  <label
                    htmlFor="cg-privacy"
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Who can join
                  </label>
                  <select
                    id="cg-privacy"
                    value={groupPrivacy}
                    disabled={loading}
                    onChange={(e) => setGroupPrivacy(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-muted/30 px-3 text-sm font-medium outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-purple-500/40 disabled:opacity-60"
                  >
                    {PRIVACY.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="cg-desc"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Description{" "}
                  <span className="font-normal normal-case text-muted-foreground/85">
                    (optional)
                  </span>
                </label>
                <Textarea
                  id="cg-desc"
                  placeholder="What is this group about?"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="min-h-[76px] resize-none rounded-xl text-sm"
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Optional images — collapsible so it doesn't eat vertical space */}
            <details className="group/details rounded-2xl border border-border/60 bg-muted/15">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold text-sm hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <ImagePlus size={18} className="text-purple-600" aria-hidden />
                  Photos (optional)
                </span>
                <ChevronDown
                  size={18}
                  className="text-muted-foreground transition group-open/details:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="space-y-4 border-t border-border/40 px-4 pb-4 pt-2">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Cover banner
                  </p>
                  <label className="relative flex h-24 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-purple-300/70 bg-purple-500/10">
                    {groupCoverImage ? (
                      <img
                        src={URL.createObjectURL(groupCoverImage)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="px-4 text-xs font-semibold text-purple-700 dark:text-purple-400">
                        Upload cover image
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setGroupCoverImage(e.target.files?.[0] || null)
                      }
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Group icon
                  </p>
                  <label className="relative mx-auto flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-purple-300/70 bg-purple-500/10">
                    {groupImage ? (
                      <img
                        src={URL.createObjectURL(groupImage)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Users size={26} className="text-purple-600" aria-hidden />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setGroupImage(e.target.files?.[0] || null)
                      }
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>
            </details>
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-border/50 bg-background px-5 py-4 sm:px-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="h-11 flex-1 rounded-xl font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateGroup}
            disabled={
              loading ||
              !groupName.trim() ||
              selectedParticipants.length === 0 ||
              !!participantsError
            }
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 font-bold text-white shadow-lg shadow-purple-500/25 hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="size-[18px] shrink-0 animate-spin"
                  aria-hidden
                />
                Creating…
              </>
            ) : (
              "Create group"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupModal;
