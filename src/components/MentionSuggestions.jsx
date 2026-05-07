import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchUsersForMention } from "../hooks/useApi";
import { Loader2, AtSign, Search, CheckCircle2 } from "lucide-react";
import Avatar from "./Avatar";

/**
 * Component to show user suggestions for mentions
 * @param {string} query - The username part after @
 * @param {Function} onSelect - Callback when a user is selected
 */
const MentionSuggestions = ({ query, onSelect, placement = "bottom-full" }) => {
  const { data, isLoading } = useSearchUsersForMention(query);
  const users = data?.data?.users || [];

  if (!query) return null;

  const isTop = placement === "top-full";
  const placementClass = isTop ? "top-full mt-2" : "bottom-full mb-2";

  return (
    <motion.div
      initial={{ opacity: 0, y: isTop ? -10 : 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isTop ? -10 : 10, scale: 0.95 }}
      className={`absolute ${placementClass} left-0 w-[calc(100vw-2.5rem)] sm:w-[320px] bg-white dark:bg-slate-900 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700 overflow-hidden z-[10000]`}
      style={{ maxWidth: 'min(320px, calc(100vw - 2.5rem))' }}
    >
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
            <AtSign size={10} className="text-white" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Suggestions
          </p>
        </div>
        {isLoading && <Loader2 size={12} className="animate-spin text-purple-500" />}
      </div>
      
      <div className="max-h-60 overflow-y-auto custom-scrollbar">
        {isLoading && users.length === 0 ? (
          <div className="p-6 flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin text-purple-500" />
            <span className="text-xs font-medium text-slate-400">Searching...</span>
          </div>
        ) : users.length > 0 ? (
          <div className="py-1">
            {users.map((user) => (
              <button
                key={user._id}
                onClick={() => onSelect(user.username)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all group text-left relative"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 scale-y-0 group-hover:scale-y-100 transition-transform" />
                <div className="shrink-0">
                  <Avatar
                    profilePicture={user.profile?.profile_picture}
                    fullName={user.profile?.full_name}
                    username={user.username}
                    size="sm"
                    className="ring-1 ring-slate-200 dark:ring-slate-700 group-hover:ring-purple-500/50 transition-all"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {user.profile?.full_name || user.username}
                    </p>
                    {user.is_verified && (
                      <CheckCircle2 size={12} className="text-blue-500 fill-blue-500/10" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    @{user.username}
                  </p>
                </div>
                {user.is_online && (
                  <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                )}
              </button>
            ))}
          </div>
        ) : !isLoading ? (
          <div className="p-8 text-center">
            <Search className="mx-auto mb-2 text-slate-300 dark:text-slate-600 w-6 h-6" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No users found</p>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};

export default MentionSuggestions;
