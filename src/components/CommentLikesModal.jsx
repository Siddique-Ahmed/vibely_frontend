import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import Avatar from "./Avatar";

const reactions = [
  { name: "like", label: "Like", emoji: "👍" },
  { name: "love", label: "Love", emoji: "❤️" },
  { name: "haha", label: "Haha", emoji: "😂" },
  { name: "wow", label: "Wow", emoji: "😮" },
  { name: "sad", label: "Sad", emoji: "😢" },
  { name: "angry", label: "Angry", emoji: "😠" },
];

const CommentLikesModal = ({
  isOpen,
  onClose,
  likes = [],
  likesByReaction = {},
  likesCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { key: "all", label: "All", count: likesCount },
    ...reactions
      .filter((r) => likesByReaction[r.name]?.length > 0)
      .map((r) => ({
        key: r.name,
        label: r.emoji,
        count: likesByReaction[r.name].length,
      })),
  ];

  const displayedLikes =
    activeTab === "all"
      ? likes
      : (likesByReaction[activeTab] || []).map((u) => ({
          ...u,
          reaction_type: activeTab,
        }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[56] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Comment Reactions
                </h3>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              {/* Tabs */}
              {tabs.length > 1 && (
                <div className="flex items-center gap-1 px-3 pt-3 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                        activeTab === tab.key
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {tab.key !== "all" && <span>{tab.label}</span>}
                      {tab.key === "all" && <span>All</span>}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          activeTab === tab.key
                            ? "bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Likes List */}
              <div className="p-3 max-h-72 overflow-y-auto space-y-1">
                {displayedLikes.length > 0 ? (
                  displayedLikes.map((like, idx) => (
                    <Link
                      key={like._id || idx}
                      to={`/profile/${like._id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition group"
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar
                          profilePicture={like.profile_picture}
                          fullName={like.full_name}
                          username={like.username}
                          size="md"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">
                          {reactions.find((r) => r.name === like.reaction_type)
                            ?.emoji || "👍"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                          {like.full_name || like.username}
                        </p>
                        {like.full_name && (
                          <p className="text-xs text-slate-400 truncate">
                            @{like.username}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-slate-400">No reactions yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommentLikesModal;
