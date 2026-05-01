import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchUsersForMention } from "../hooks/useApi";
import { Loader2, AtSign, Search, CheckCircle2 } from "lucide-react";

/**
 * Component to show user suggestions for mentions
 * @param {string} query - The username part after @
 * @param {Function} onSelect - Callback when a user is selected
 */
const MentionSuggestions = ({ query, onSelect, placement = "bottom-full" }) => {
  const { data, isLoading } = useSearchUsersForMention(query);
  const users = data?.data?.users || [];

  if (!query || (users.length === 0 && !isLoading)) return null;

  const placementClass = placement === "top-full" ? "top-full mt-2" : "bottom-full mb-4";

  return (
    <motion.div
      initial={{ opacity: 0, y: placement === "top-full" ? -10 : 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: placement === "top-full" ? -10 : 10, scale: 0.95 }}
      className={`absolute ${placementClass} left-0 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-[100]`}
    >
      <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
            <AtSign size={10} className="text-white" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Mention User
          </p>
        </div>
        {isLoading && <Loader2 size={12} className="animate-spin text-purple-500" />}
      </div>
      
      <div className="max-h-64 overflow-y-auto custom-scrollbar">
        {isLoading && users.length === 0 ? (
          <div className="p-8 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-purple-100 dark:border-purple-900/30 border-t-purple-500 animate-spin" />
              <Search className="absolute inset-0 m-auto text-purple-500 w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-400">Searching Vibely...</span>
          </div>
        ) : users.length > 0 ? (
          <div className="py-1">
            {users.map((user) => (
              <button
                key={user._id}
                onClick={() => onSelect(user.username)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all duration-200 group text-left relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                <div className="relative">
                  <img
                    src={user.profile?.profile_picture || "/avatar.png"}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-purple-200 dark:group-hover:border-purple-800 transition-all shadow-sm"
                  />
                  {user.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {user.profile?.full_name || user.username}
                    </p>
                    {user.is_verified && (
                      <CheckCircle2 size={12} className="text-blue-500 fill-blue-500/10" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <Search className="text-slate-300 dark:text-slate-600 w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No results</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 px-4">
              We couldn't find any users matching your search
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MentionSuggestions;
