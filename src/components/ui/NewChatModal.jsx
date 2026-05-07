import React, { useMemo, useState, useEffect } from "react";
import {
  X,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
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

export function NewChatModal({
  open,
  onClose,
  contacts = [],
  contactsLoading = false,
  contactsError = null,
  onSelectUser,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearchQuery("");
  }, [open]);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((p) => {
      const u = (p?.username ?? "").toLowerCase();
      const fn = (p?.profile?.full_name ?? "").toLowerCase();
      const em = (p?.email ?? "").toLowerCase();
      return u.includes(q) || fn.includes(q) || em.includes(q);
    });
  }, [contacts, searchQuery]);

  const handleSelectUser = async (user) => {
    setLoading(true);
    try {
      await onSelectUser(user._id);
      setSearchQuery("");
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
    !contactsLoading && !contactsError && contacts.length === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-labelledby="new-chat-title"
        aria-modal="true"
        className={cn(
          "flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border/60 bg-background shadow-2xl",
          "max-h-[min(92dvh,600px)] animate-in zoom-in-95 duration-200 motion-reduce:animate-none",
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/50 bg-muted/25 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="new-chat-title"
              className="text-lg font-bold tracking-tight sm:text-xl"
            >
              Start a new chat
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Search for your followers or people you follow to start chatting.
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

        {/* Scrollable body */}
        <div className="max-h-[calc(min(92dvh,600px)-10.75rem)] min-h-[220px] overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Search by name, username, or email
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. iqbal, john doe..."
                  disabled={loading || contactsLoading}
                  className="h-11 rounded-xl bg-muted/40 pl-9 text-base"
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex max-h-[40vh] flex-col overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-inner">
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {contactsError ? (
                  <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
                    <p className="text-sm font-medium text-destructive">
                      {contactsError}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Refresh or try again in a moment.
                    </p>
                  </div>
                ) : contactsLoading ? (
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
                ) : filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
                    {contactsEmptyReady ? (
                      <>
                        <p className="text-sm font-medium">No contacts yet</p>
                        <p className="text-xs text-muted-foreground">
                          Follow some users or accept followers to start chatting.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">No results found</p>
                        <p className="text-xs text-muted-foreground">
                          Try searching with a different name or username.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredContacts.map((contact) => (
                      <button
                        key={contact._id}
                        onClick={() => handleSelectUser(contact)}
                        disabled={loading}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all",
                          "hover:bg-muted/60 active:scale-95",
                          loading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Avatar className="size-10 shrink-0 border border-border">
                          <AvatarImage src={contact?.profile?.profile_picture} />
                          <AvatarFallback className="bg-purple-100 text-purple-700 font-bold">
                            {contact?.username?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {contact?.profile?.full_name || contact?.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{contact?.username}
                          </p>
                        </div>
                        {loading && (
                          <Loader2 size={16} className="shrink-0 animate-spin text-purple-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewChatModal;
