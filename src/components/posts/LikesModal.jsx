import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import Avatar from "../Avatar";

const reactionEmojis = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😠",
};

const reactionColors = {
  like: "bg-blue-50 text-blue-600",
  love: "bg-red-50 text-red-600",
  haha: "bg-yellow-50 text-yellow-600",
  wow: "bg-yellow-50 text-yellow-600",
  sad: "bg-blue-50 text-blue-500",
  angry: "bg-orange-50 text-orange-600",
};

const LikesModal = ({ isOpen, onClose, likes = [], likesByReaction = {}, likesCount = 0 }) => {
  const [activeReaction, setActiveReaction] = React.useState(null);

  const filteredLikes = useMemo(() => {
    if (!activeReaction) return likes;
    return likes.filter(like => like.reaction_type === activeReaction);
  }, [likes, activeReaction]);

  const reactionCounts = useMemo(() => {
    const counts = {};
    likes.forEach(like => {
      counts[like.reaction_type] = (counts[like.reaction_type] || 0) + 1;
    });
    return counts;
  }, [likes]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Likes ({likesCount})
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Reaction Filter Tabs */}
            {Object.keys(reactionCounts).length > 0 && (
              <div className="flex gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                <button
                  onClick={() => setActiveReaction(null)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    activeReaction === null
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All ({likesCount})
                </button>
                {Object.entries(reactionCounts).map(([reaction, count]) => (
                  <button
                    key={reaction}
                    onClick={() => setActiveReaction(reaction)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-1 ${
                      activeReaction === reaction
                        ? reactionColors[reaction]
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{reactionEmojis[reaction]}</span>
                    <span>({count})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Likes List */}
            <div className="flex-1 overflow-y-auto">
              {filteredLikes.length > 0 ? (
                <div className="space-y-2 p-4">
                  {filteredLikes.map((like) => (
                    <Link
                      key={like._id}
                      to={`/profile/${like._id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition group"
                    >
                      <Avatar
                        profilePicture={like.profile_picture}
                        fullName={like.full_name}
                        username={like.username}
                        size="md"
                        className="border-2 border-slate-200 dark:border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                          {like.username}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          @{like.username}
                        </p>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${reactionColors[like.reaction_type]}`}
                      >
                        {reactionEmojis[like.reaction_type]}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <span className="text-2xl">🤔</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">No likes yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LikesModal;
