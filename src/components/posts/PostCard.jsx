import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import {
  useToggleLike,
  useToggleBookmark,
  useSharePost,
  useDeletePost,
} from "../../hooks/useApi";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Bookmark,
  MapPin,
  Clock,
  Link2,
  Check,
} from "lucide-react";
import { formatTimeAgo } from "../../utils/formatters";
import { processMentions } from "../../utils/textProcessors";
import LikesModal from "./LikesModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import EditPostModal from "../EditPostModal";
import Avatar from "../Avatar";
import { useRef } from "react";
import { useEffect } from "react";

const reactions = [
  {
    name: "like",
    label: "Like",
    emoji: "👍",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    name: "love",
    label: "Love",
    emoji: "❤️",
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    name: "haha",
    label: "Haha",
    emoji: "😂",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    name: "wow",
    label: "Wow",
    emoji: "😮",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    name: "sad",
    label: "Sad",
    emoji: "😢",
    color: "text-blue-400",
    bg: "bg-blue-50",
  },
  {
    name: "angry",
    label: "Angry",
    emoji: "😠",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
];

const PostCard = ({ post, onLike, onShare }) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: toggleLikeMutation } = useToggleLike();
  const { mutate: toggleBookmarkMutation } = useToggleBookmark();
  const { mutate: sharePostMutation } = useSharePost();
  const { mutate: deletePostMutation } = useDeletePost();

  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Safely convert location to string (could be GeoJSON object or plain string)
  const locationStr = (() => {
    const loc = post?.location;
    if (!loc) return null;
    if (typeof loc === "string" && loc.trim()) return loc.trim();
    if (typeof loc === "object") {
      // If it's a name/address field (Nominatim)
      if (loc.name) return loc.name;
      if (loc.address) return loc.address;
      // If it's a GeoJSON object with coordinates but no name
      if (loc.type === "Point" && loc.coordinates) return "Pinned Location";
    }
    return null;
  })();

  // Optimistic like state
  const [isLiked, setIsLiked] = useState(
    post?.isLiked ?? post?.is_liked ?? false,
  );
  const [currentReaction, setCurrentReaction] = useState(
    post?.reaction_type || (isLiked ? "like" : null),
  );
  const [likesCount, setLikesCount] = useState(post?.likes_count ?? 0);
  const [likes, setLikes] = useState(post?.likes ?? []);
  const [likesByReaction, setLikesByReaction] = useState(
    post?.likesByReaction ?? {},
  );
  const [showReactions, setShowReactions] = useState(false);
  const [showLikesOnHover, setShowLikesOnHover] = useState(false);
  const [isLikingPending, setIsLikingPending] = useState(false);
  const reactionTimeoutRef = useRef(null);
  const likeCountTimeoutRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const optionsRef = useRef(null);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showOptions]);

  // Optimistic bookmark state
  const [isBookmarked, setIsBookmarked] = useState(
    post?.isBookmarked ?? post?.is_bookmarked ?? false,
  );

  // Sync state with props when they change (e.g. after a refetch or update from another page)
  useEffect(() => {
    const liked = post?.isLiked ?? post?.is_liked ?? false;
    setIsLiked(liked);
    setCurrentReaction(post?.reaction_type || (liked ? "like" : null));
    setLikesCount(post?.likes_count ?? 0);
    setLikes(post?.likes ?? []);
    setLikesByReaction(post?.likesByReaction ?? {});
    setIsBookmarked(post?.isBookmarked ?? post?.is_bookmarked ?? false);
  }, [post]);

  const commentsCount = post?.comments_count || 0;

  const handleCardClick = () => navigate(`/post/${post._id}`);

  const timeAgo = post?.createdAt ? formatTimeAgo(post.createdAt) : "";

  const handleLike = (reactionType = "like") => {
    // Prevent double mutations while one is pending
    if (isLikingPending) return;

    const wasLiked = isLiked;
    const prevReaction = currentReaction;

    console.debug("[PostCard] handleLike called", {
      postId: post?._id,
      reactionType,
      wasLiked,
      prevReaction,
    });

    setIsLikingPending(true);

    // If clicking same reaction that is already active, unlike
    if (wasLiked && prevReaction === reactionType) {
      setIsLiked(false);
      setCurrentReaction(null);
      setLikesCount((c) => Math.max(0, c - 1));

      toggleLikeMutation(
        { targetId: post._id, targetType: "Post", reactionType },
        {
          onSuccess: (data) => {
            const res = data?.data || {};
            if (res.post) {
              setIsLiked(res.post.isLiked ?? res.post.is_liked ?? false);
              setCurrentReaction(res.post.reaction_type || null);
              setLikesCount(res.post.likes_count ?? 0);
              setLikes(res.post.likes ?? []);
              setLikesByReaction(res.post.likesByReaction ?? {});
            }
            setIsLikingPending(false);
          },
          onError: () => {
            setIsLiked(true);
            setCurrentReaction(prevReaction);
            setLikesCount((c) => c + 1);
            setIsLikingPending(false);
          },
        },
      );
    } else {
      // Like or change reaction
      setIsLiked(true);
      setCurrentReaction(reactionType);
      if (!wasLiked) setLikesCount((c) => c + 1);

      toggleLikeMutation(
        { targetId: post._id, targetType: "Post", reactionType },
        {
          onSuccess: (data) => {
            const res = data?.data || {};
            if (res.post) {
              setIsLiked(res.post.isLiked ?? res.post.is_liked ?? true);
              setCurrentReaction(res.post.reaction_type || reactionType);
              setLikesCount(
                res.post.likes_count ??
                  (wasLiked ? likesCount : likesCount + 1),
              );
              setLikes(res.post.likes ?? []);
              setLikesByReaction(res.post.likesByReaction ?? {});
            }
            setIsLikingPending(false);
          },
          onError: () => {
            setIsLiked(wasLiked);
            setCurrentReaction(prevReaction);
            if (!wasLiked) setLikesCount((c) => Math.max(0, c - 1));
            setIsLikingPending(false);
          },
        },
      );
    }
    setShowReactions(false);
  };

  const handleMouseEnterLike = () => {
    reactionTimeoutRef.current = setTimeout(() => {
      setShowReactions(true);
    }, 300); // Reduced from 500ms for faster response
  };

  const handleMouseLeaveLike = () => {
    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    // Give time to move to picker before closing
    setTimeout(() => {
      setShowReactions(false);
    }, 200);
  };

  const handleTouchStart = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowReactions(true);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500); // 500ms long press threshold
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleTouchMove = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);
    toggleBookmarkMutation(post._id, {
      onError: () => setIsBookmarked(wasBookmarked),
    });
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post._id}`;
    
    // Try native share first if available
    if (navigator.share) {
      navigator.share({ url }).catch(() => {
        // Fallback to clipboard if user cancels or error occurs
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      });
    } else {
      // Fallback to clipboard copy
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
    
    sharePostMutation(post._id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowEditModal(true);
    setShowOptions(false);
  };

  const handleEditSuccess = (updatedPost) => {
    // Update the post data in the component
    if (updatedPost) {
      // The query will be invalidated by the useUpdatePost hook
      // so the post will be refetched automatically
    }
  };

  const handleConfirmDelete = () => {
    setIsDeleting(true);
    deletePostMutation(post._id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setShowOptions(false);
        setIsDeleting(false);
      },
      onError: () => {
        setIsDeleting(false);
      },
    });
  };

  const isOwn = user?._id === post?.created_by?._id;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 mb-4 backdrop-blur-sm shadow-sm hover:shadow-lg dark:hover:shadow-xl dark:shadow-slate-950/50 transition-all duration-300"
      >
        {/* Post Header */}
        <div className="p-5 flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-transparent via-transparent to-purple-50/30 dark:to-purple-900/10">
          <Link
            to={`/profile/${post.created_by?._id}`}
            className="flex items-center gap-3 group flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative"
              onMouseEnter={(e) => {
                const child = e.currentTarget.querySelector("img, div");
                if (child) child.style.borderColor = "rgba(124,58,237,0.6)";
              }}
              onMouseLeave={(e) => {
                const child = e.currentTarget.querySelector("img, div");
                if (child) child.style.borderColor = "transparent";
              }}
            >
              <Avatar
                profilePicture={post.created_by?.profile?.profile_picture}
                fullName={post.created_by?.profile?.full_name}
                username={post.created_by?.username}
                size="md"
                className="border-2 border-transparent transition shadow-sm"
              />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white dark:border-slate-900 shadow-md" 
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition leading-none truncate">
                {post.created_by?.profile?.full_name ||
                  post.created_by?.username}
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  @{post.created_by?.username}
                </p>
                {locationStr && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">
                      •
                    </span>
                    <MapPin size={11} className="text-purple-500 flex-shrink-0" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{locationStr}</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Clock size={11} className="text-slate-400 flex-shrink-0" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{timeAgo}</p>
              </div>
            </div>
          </Link>

          <div className="relative" ref={optionsRef}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(!showOptions);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-500"
            >
              <MoreHorizontal size={18} />
            </motion.button>
            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-10 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20 min-w-[150px]"
                >
                  <button
                    onClick={handleShare}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    Copy Link
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                    Report Post
                  </button>
                  {isOwn && (
                    <>
                      <button
                        onClick={handleEdit}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                      >
                        Edit Post
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition font-medium border-t border-slate-100 dark:border-slate-700 mt-1 pt-2.5"
                      >
                        Delete Post
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Post Caption */}
        {post.caption && (
          <div className="px-4 pb-3">
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {processMentions(post.caption, user?.blocked_usernames)}
            </p>
          </div>
        )}

        {/* Media Grid */}
        {post.media && post.media.length > 0 && (
          <div
            className={`overflow-hidden ${
              post.media.length === 1
                ? ""
                : post.media.length === 2
                  ? "grid grid-cols-2 gap-0.5"
                  : post.media.length >= 3
                    ? "grid grid-cols-2 gap-0.5"
                    : ""
            }`}
            onClick={handleCardClick}
          >
            {post.media.slice(0, 4).map((item, idx) => {
              const isLast = idx === 3 && post.media.length > 4;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ brightness: 0.95 }}
                  className={`relative overflow-hidden cursor-pointer bg-slate-200 dark:bg-slate-800 ${
                    post.media.length === 1
                      ? "w-full max-h-[480px]"
                      : idx === 0 && post.media.length === 3
                        ? "row-span-2 h-64"
                        : "h-48"
                  }`}
                >
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt={`Post media ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      controls={post.media.length === 1}
                    />
                  )}
                  {isLast && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <p className="text-white text-2xl font-bold">
                        +{post.media.length - 4}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Engagement Stats */}
        <div className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 relative">
            <div className="flex -space-x-1">
              {likes.length > 0 && (
                <>
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border border-white dark:border-slate-900">
                    <Heart size={10} className="text-white fill-white" />
                  </div>
                  {post?.comments_count > 0 && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center border border-white dark:border-slate-900"
                      style={{
                        background: "linear-gradient(135deg, #EC4899, #F97316)",
                      }}
                    >
                      <MessageCircle
                        size={10}
                        className="text-white fill-white"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            {likesCount > 0 ? (
              <div
                onMouseEnter={() => {
                  likeCountTimeoutRef.current = setTimeout(() => {
                    setShowLikesOnHover(true);
                  }, 200);
                }}
                onMouseLeave={() => {
                  if (likeCountTimeoutRef.current)
                    clearTimeout(likeCountTimeoutRef.current);
                  setTimeout(() => setShowLikesOnHover(false), 100);
                }}
                className="relative"
              >
                <button
                  onClick={() => setShowLikesModal(true)}
                  className="ml-1 hover:underline cursor-pointer font-medium"
                >
                  {likesCount} {likesCount === 1 ? "like" : "likes"}
                </button>

                {/* Likes Popup on Hover */}
                <AnimatePresence>
                  {showLikesOnHover && likes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-40 min-w-max max-w-xs"
                      onMouseEnter={() => {
                        if (likeCountTimeoutRef.current)
                          clearTimeout(likeCountTimeoutRef.current);
                      }}
                      onMouseLeave={() => {
                        setTimeout(() => setShowLikesOnHover(false), 100);
                      }}
                    >
                      <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                        {likes.slice(0, 5).map((like) => (
                          <Link
                            key={like._id}
                            to={`/profile/${like._id}`}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition group"
                          >
                            <Avatar
                              profilePicture={like.profile_picture}
                              fullName={like.full_name}
                              username={like.username}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                                {like.username}
                              </p>
                            </div>
                            <span className="text-xs">
                              {reactions.find(
                                (r) => r.name === like.reaction_type,
                              )?.emoji || "👍"}
                            </span>
                          </Link>
                        ))}
                        {likes.length > 5 && (
                          <button
                            onClick={() => {
                              setShowLikesOnHover(false);
                              setShowLikesModal(true);
                            }}
                            className="w-full text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium py-1"
                          >
                            View all {likes.length} likes
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <span className="ml-1">Be the first to like</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {post?.shares_count > 0 && (
              <span className="hover:underline cursor-default">
                {post.shares_count} shares
              </span>
            )}
            {post?.comments_count > 0 && (
              <button onClick={handleCardClick} className="hover:underline">
                {post.comments_count} comments
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-2 py-1 flex items-center gap-1 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
          {/* Like Button with Reaction Picker */}
          <div
            className="flex-1 relative"
            onMouseEnter={handleMouseEnterLike}
            onMouseLeave={() => {
              if (reactionTimeoutRef.current)
                clearTimeout(reactionTimeoutRef.current);
              setShowReactions(false);
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onContextMenu={(e) => {
              // Prevent context menu from appearing on long press on mobile
              if (window.innerWidth < 1024) e.preventDefault();
            }}
          >
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className="absolute left-0 bottom-full pb-3 -mb-1 bg-transparent z-50 no-select"
                  style={{ originX: 0, originY: 1 }}
                >
                  <div className="bg-white dark:bg-slate-800 shadow-xl rounded-full px-1.5 sm:px-2 py-1 sm:py-1.5 flex items-center gap-0.5 sm:gap-1 border border-slate-200 dark:border-slate-700 scale-90 sm:scale-100 origin-left">
                    {reactions.map((r, i) => (
                      <motion.button
                        key={r.name}
                        whileHover={{ scale: 1.3, y: -5 }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          transition: { delay: i * 0.05 },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(r.name);
                        }}
                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xl sm:text-2xl hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                        title={r.label}
                      >
                        {r.emoji}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={(e) => {
                e.stopPropagation();
                if (isLongPressRef.current) return;
                handleLike(currentReaction || "like");
              }}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isLiked
                  ? `${reactions.find((r) => r.name === currentReaction)?.color || "text-red-500"} ${reactions.find((r) => r.name === currentReaction)?.bg || "bg-red-50"} dark:bg-opacity-20`
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500"
              }`}
            >
              {isLiked && currentReaction !== "like" ? (
                <span className="text-lg">
                  {reactions.find((r) => r.name === currentReaction)?.emoji}
                </span>
              ) : (
                <Heart
                  size={18}
                  strokeWidth={1.8}
                  className={isLiked ? "fill-red-500 text-red-500" : ""}
                />
              )}
              <span className="hidden xs:inline">
                {isLiked
                  ? reactions.find((r) => r.name === currentReaction)?.label ||
                    "Liked"
                  : "Like"}
              </span>
            </motion.button>
          </div>

          {/* Comment */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all text-sm font-medium"
          >
            <MessageCircle size={18} strokeWidth={1.8} />
            <span className="hidden xs:inline">Comment</span>
          </motion.button>

          {/* Share — copies link + increments counter */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleShare}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all text-sm font-medium ${
              copied
                ? "text-green-600 bg-green-50 dark:bg-green-900/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-500"
            }`}
          >
            {copied ? (
              <Check size={18} strokeWidth={2} />
            ) : (
              <Share2 size={18} strokeWidth={1.8} />
            )}
            <span className="hidden xs:inline">{copied ? "Copied!" : "Share"}</span>
          </motion.button>

          {/* Bookmark */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleBookmark}
            className={`p-2.5 rounded-xl transition-all ${
              isBookmarked
                ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-yellow-500"
            }`}
          >
            <Bookmark
              size={18}
              strokeWidth={1.8}
              className={isBookmarked ? "fill-yellow-500" : ""}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Likes Modal */}
      <LikesModal
        isOpen={showLikesModal}
        onClose={() => {
          setShowLikesModal(false);
          setShowLikesOnHover(false);
          if (likeCountTimeoutRef.current)
            clearTimeout(likeCountTimeoutRef.current);
        }}
        likes={likes}
        likesByReaction={likesByReaction}
        likesCount={likesCount}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

export default PostCard;
