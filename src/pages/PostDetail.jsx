import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePost, useComments, useCreateComment, useToggleLike, useToggleBookmark, useSharePost, useDeletePost
} from "../hooks/useApi";
import DeleteConfirmModal from "../components/posts/DeleteConfirmModal";
import EditPostModal from "../components/EditPostModal";
import { formatTimeAgo } from "../utils/formatters";
import { processMentions } from "../utils/textProcessors";
import MainLayout from "../components/layouts/MainLayout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import CommentLikesModal from "../components/CommentLikesModal";
import {
  Heart, MessageCircle, Bookmark, Send, Loader2, Share2, Check,
  MessageSquareOff, MoreHorizontal, ArrowLeft,
} from "lucide-react";
import MentionSuggestions from "../components/MentionSuggestions";
import { useRef, useEffect } from "react";

const reactions = [
  { name: "like", label: "Like", emoji: "👍", color: "text-blue-500", bg: "bg-blue-50" },
  { name: "love", label: "Love", emoji: "❤️", color: "text-red-500", bg: "bg-red-50" },
  { name: "haha", label: "Haha", emoji: "😂", color: "text-yellow-500", bg: "bg-yellow-50" },
  { name: "wow", label: "Wow", emoji: "😮", color: "text-yellow-500", bg: "bg-yellow-50" },
  { name: "sad", label: "Sad", emoji: "😢", color: "text-blue-400", bg: "bg-blue-50" },
  { name: "angry", label: "Angry", emoji: "😠", color: "text-orange-600", bg: "bg-orange-50" },
];

// ─── CommentItem ─────────────────────────────────────────────────────────────
const CommentItem = ({ comment, toggleLike, currentUser, isReply = false, onReply = () => { } }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [isLiked, setIsLiked] = useState(!!comment.isLiked);
  const [currentReaction, setCurrentReaction] = useState(
    comment.reaction_type || (comment.isLiked ? "like" : null)
  );
  const [likesCount, setLikesCount] = useState(Number(comment.likes_count) || 0);
  const [likes, setLikes] = useState(comment.likes || []);
  const [likesByReaction, setLikesByReaction] = useState(comment.likesByReaction || {});
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [isCommentLikingPending, setIsCommentLikingPending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPos,    setCursorPos]    = useState(0);

  const reactionTimeoutRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setShowReactions(true);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleTouchMove = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  // Sync when comment prop changes (e.g. after refetch)
  useEffect(() => {
    setIsLiked(!!comment.isLiked);
    setCurrentReaction(comment.reaction_type || (comment.isLiked ? "like" : null));
    setLikesCount(Number(comment.likes_count) || 0);
    setLikes(comment.likes || []);
    setLikesByReaction(comment.likesByReaction || {});
  }, [comment._id, comment.isLiked, comment.reaction_type, comment.likes_count, comment.likes, comment.likesByReaction]);

  const handleLike = (reactionType = "like") => {
    // Prevent double mutations while one is pending
    if (isCommentLikingPending) return;

    const wasLiked = isLiked;
    const prevReaction = currentReaction;
    const prevCount = likesCount;
    const prevLikes = likes;
    const prevByReaction = likesByReaction;

    setIsCommentLikingPending(true);

    if (wasLiked && prevReaction === reactionType) {
      // ── Unlike ──
      setIsLiked(false);
      setCurrentReaction(null);
      setLikesCount((c) => Math.max(0, c - 1));

      toggleLike(
        { targetId: comment._id, targetType: "Comment", reactionType },
        {
          onSuccess: (data) => {
            const res = data?.data || {};
            if (res.comment) {
              setIsLiked(!!res.comment.isLiked);
              setCurrentReaction(res.comment.reaction_type || null);
              setLikesCount(Number(res.comment.likes_count) || 0);
              setLikes(res.comment.likes || []);
              setLikesByReaction(res.comment.likesByReaction || {});
            }
            setIsCommentLikingPending(false);
          },
          onError: () => {
            setIsLiked(wasLiked);
            setCurrentReaction(prevReaction);
            setLikesCount(prevCount);
            setLikes(prevLikes);
            setLikesByReaction(prevByReaction);
            setIsCommentLikingPending(false);
          },
        }
      );
    } else {
      // ── Like / change reaction ──
      setIsLiked(true);
      setCurrentReaction(reactionType);
      if (!wasLiked) setLikesCount((c) => c + 1);

      toggleLike(
        { targetId: comment._id, targetType: "Comment", reactionType },
        {
          onSuccess: (data) => {
            const res = data?.data || {};
            if (res.comment) {
              setIsLiked(!!res.comment.isLiked);
              setCurrentReaction(res.comment.reaction_type || reactionType);
              setLikesCount(Number(res.comment.likes_count) ?? (wasLiked ? prevCount : prevCount + 1));
              setLikes(res.comment.likes || []);
              setLikesByReaction(res.comment.likesByReaction || {});
            }
            setIsCommentLikingPending(false);
          },
          onError: () => {
            setIsLiked(wasLiked);
            setCurrentReaction(prevReaction);
            if (!wasLiked) setLikesCount(prevCount);
            setLikes(prevLikes);
            setLikesByReaction(prevByReaction);
            setIsCommentLikingPending(false);
          },
        }
      );
    }
    setShowReactions(false);
  };

  const handleReplyChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setReplyText(value);
    setCursorPos(position);

    const textBeforeCursor = value.substring(0, position);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    if (lastAtIdx !== -1) {
      const query = textBeforeCursor.substring(lastAtIdx + 1);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleMentionSelect = (username) => {
    const textBeforeAt = replyText.substring(0, replyText.lastIndexOf("@", cursorPos - 1));
    const textAfterCursor = replyText.substring(cursorPos);
    const newText = `${textBeforeAt}@${username} ${textAfterCursor}`;
    setReplyText(newText);
    setShowMentions(false);
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    setIsSendingReply(true);
    onReply(comment._id, replyText, () => {
      setReplyText("");
      setShowReplyInput(false);
      setIsSendingReply(false);
    });
  };

  const reactionData = reactions.find((r) => r.name === currentReaction) || reactions[0];

  return (
    <>
      <div className={`flex gap-3 ${isReply ? "mt-2" : ""}`}>
        <img
          src={comment.created_by?.profile?.profile_picture || "/avatar.png"}
          alt={comment.created_by?.username}
          className={`${isReply ? "w-6 h-6" : "w-8 h-8"} rounded-full object-cover flex-shrink-0 mt-0.5`}
        />
        <div className="flex-1 group">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none px-3 py-2 max-w-fit">
            <p className="text-xs font-semibold text-slate-900 dark:text-white mb-0.5">
              {comment.created_by?.username}
            </p>
            <p className={`${isReply ? "text-xs" : "text-sm"} text-slate-700 dark:text-slate-300`}>
              {processMentions(comment.content, currentUser?.blocked_usernames)}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1 ml-2">
            <p className="text-[10px] text-slate-400">{formatTimeAgo(comment.createdAt)}</p>

            {/* Like button with reaction picker */}
            <div
              className="relative"
              onMouseEnter={() => {
                reactionTimeoutRef.current = setTimeout(() => setShowReactions(true), 500);
              }}
              onMouseLeave={() => {
                clearTimeout(reactionTimeoutRef.current);
                setShowReactions(false);
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onContextMenu={(e) => {
                if (window.innerWidth < 1024) e.preventDefault();
              }}
            >
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className="absolute left-0 bottom-full pb-2 -mb-1 bg-transparent z-50 no-select"
                  >
                    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-full px-1.5 py-1 flex items-center gap-0.5 border border-slate-200 dark:border-slate-700">
                      {reactions.map((r) => (
                        <motion.button
                          key={r.name}
                          whileHover={{ scale: 1.3, y: -3 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); handleLike(r.name); }}
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                        >
                          {r.emoji}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => handleLike(currentReaction || "like")}
                className={`text-[10px] font-bold transition hover:underline ${isLiked ? reactionData.color : "text-slate-500"
                  }`}
              >
                {isLiked && currentReaction !== "like" ? reactionData.label : "Like"}
              </button>
            </div>

            {/* Reply button (only for top-level comments) */}
            {!isReply && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="text-[10px] font-bold text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition hover:underline ml-3"
              >
                Reply
              </button>
            )}

            {/* Likes count pill — clickable to open modal */}
            {likesCount > 0 && (
              <button
                onClick={() => setShowLikesModal(true)}
                className="relative flex items-center gap-1 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-full px-1.5 py-0.5 -mt-4 ml-auto hover:shadow-md transition cursor-pointer"
              >
                <span className="text-[10px]">
                  {currentReaction
                    ? reactions.find((r) => r.name === currentReaction)?.emoji
                    : "👍"}
                </span>
                <span className="text-[10px] font-medium text-slate-500">{likesCount}</span>
              </button>
            )}
          </div>

          {/* Reply input */}
          {showReplyInput && !isReply && (
            <div className="mt-3 ml-2 flex gap-2 items-end">
              <img
                src={currentUser?.profile?.profile_picture || "/avatar.png"}
                alt="You"
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 relative">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Reply to ${comment.created_by?.username}...`}
                    value={replyText}
                    onChange={handleReplyChange}
                    onKeyUp={(e) => setCursorPos(e.target.selectionStart)}
                    onBlur={() => setTimeout(() => setShowMentions(false), 200)}
                    onKeyDown={(e) => e.key === "Enter" && handleReply()}
                    className="bg-transparent flex-1 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-500"
                    autoFocus
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleReply}
                    disabled={!replyText.trim() || isSendingReply}
                    className={`flex-shrink-0 p-1 rounded-full transition ${replyText.trim()
                        ? "hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                        : "text-slate-400 cursor-not-allowed"
                      }`}
                  >
                    {isSendingReply ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {showMentions && (
                    <div className="absolute bottom-full left-0 mb-2 w-full max-w-[280px]">
                      <MentionSuggestions query={mentionQuery} onSelect={handleMentionSelect} />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Replies toggle */}
          {!isReply && comment.replies?.length > 0 && (
            <>
              <motion.button
                onClick={() => setShowReplies(!showReplies)}
                className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline mt-2 ml-2 transition"
              >
                {showReplies
                  ? "Hide"
                  : `See ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`}
              </motion.button>

              <AnimatePresence>
                {showReplies && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-2 mt-2 space-y-3 overflow-hidden"
                  >
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply._id}
                        comment={reply}
                        toggleLike={toggleLike}
                        currentUser={currentUser}
                        isReply={true}
                        onReply={onReply}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* Comment Likes Modal */}
      <CommentLikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        likes={likes}
        likesByReaction={likesByReaction}
        likesCount={likesCount}
      />
    </>
  );
};

// ─── PostDetail ───────────────────────────────────────────────────────────────
const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useSelector((s) => s.auth);

  const { data: postData, isLoading } = usePost(postId);
  const { data: commentsData, isLoading: commentsLoading } = useComments(postId, 1, 50);
  const { mutate: createComment, isPending: sending } = useCreateComment();
  const { mutate: toggleLike } = useToggleLike();
  const { mutate: toggleBookmark } = useToggleBookmark();
  const { mutate: sharePost } = useSharePost();
  const { mutate: deletePost } = useDeletePost();

  const [commentText, setCommentText] = useState("");
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const post = postData?.data ?? postData;

  const [isLiked, setIsLiked] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(null);
  const [likesCount, setLikesCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isLikingPending, setIsLikingPending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPos,    setCursorPos]    = useState(0);
  const reactionTimeoutRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setShowReactions(true);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleTouchMove = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  // Sync post state whenever post data changes
  useEffect(() => {
    if (post) {
      const liked = post?.isLiked ?? post?.is_liked ?? false;
      setIsLiked(!!liked);
      setCurrentReaction(post?.reaction_type || (liked ? "like" : null));
      setLikesCount(Number(post?.likes_count) ?? 0);
      setIsBookmarked(!!(post?.isBookmarked ?? post?.is_bookmarked));
    }
  }, [post?._id, post?.isLiked, post?.reaction_type, post?.likes_count, post?.isBookmarked]);

  const comments = commentsData?.data?.comments ?? commentsData?.comments ?? [];

  const handleCommentChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setCommentText(value);
    setCursorPos(position);

    const textBeforeCursor = value.substring(0, position);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    if (lastAtIdx !== -1) {
      const query = textBeforeCursor.substring(lastAtIdx + 1);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleMentionSelect = (username) => {
    const textBeforeAt = commentText.substring(0, commentText.lastIndexOf("@", cursorPos - 1));
    const textAfterCursor = commentText.substring(cursorPos);
    const newText = `${textBeforeAt}@${username} ${textAfterCursor}`;
    setCommentText(newText);
    setShowMentions(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim() || sending) return;
    createComment({ postId, content: commentText });
    setCommentText("");
  };

  const handleReply = (parentCommentId, replyContent, onSuccess) => {
    if (!replyContent.trim()) return;
    createComment(
      { postId, content: replyContent, parentCommentId },
      { onSuccess: () => onSuccess?.() }
    );
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    sharePost(postId);
  };

  const handleToggleBookmark = () => {
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);
    toggleBookmark(postId, {
      onError: () => setIsBookmarked(wasBookmarked),
    });
  };

  const handleEdit = () => {
    setShowEditModal(true);
    setShowOptions(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
    setShowOptions(false);
  };

  const handleConfirmDelete = () => {
    setIsDeleting(true);
    deletePost(postId, {
      onSuccess: () => {
        setIsDeleting(false);
        setShowDeleteModal(false);
        navigate(-1); // Go back after deleting
      },
      onError: () => {
        setIsDeleting(false);
      },
    });
  };

  const handleEditSuccess = () => {
    // Post will be refetched by React Query
    setShowEditModal(false);
  };

  const handleLike = (reactionType = "like") => {
    // Prevent double mutations while one is pending
    if (isLikingPending) return;

    const wasLiked = isLiked;
    const prevReaction = currentReaction;
    const prevCount = likesCount;

    setIsLikingPending(true);

    if (wasLiked && prevReaction === reactionType) {
      // ── Unlike ──
      setIsLiked(false);
      setCurrentReaction(null);
      setLikesCount((c) => Math.max(0, c - 1));

      toggleLike(
        { targetId: postId, targetType: "Post", reactionType },
        {
          onSuccess: (data) => {
            const res = data?.data?.post || data?.data || {};
            if (res.likes_count !== undefined) {
              setIsLiked(!!(res.isLiked ?? res.is_liked));
              setCurrentReaction(res.reaction_type || null);
              setLikesCount(Number(res.likes_count));
            }
            setIsLikingPending(false);
          },
          onError: () => {
            setIsLiked(true);
            setCurrentReaction(prevReaction);
            setLikesCount(prevCount);
            setIsLikingPending(false);
          },
        }
      );
    } else {
      // ── Like / change reaction ──
      setIsLiked(true);
      setCurrentReaction(reactionType);
      if (!wasLiked) setLikesCount((c) => c + 1);

      toggleLike(
        { targetId: postId, targetType: "Post", reactionType },
        {
          onSuccess: (data) => {
            const res = data?.data?.post || data?.data || {};
            if (res.likes_count !== undefined) {
              setIsLiked(!!(res.isLiked ?? res.is_liked ?? true));
              setCurrentReaction(res.reaction_type || reactionType);
              setLikesCount(Number(res.likes_count));
            }
            setIsLikingPending(false);
          },
          onError: () => {
            setIsLiked(wasLiked);
            setCurrentReaction(prevReaction);
            setLikesCount(prevCount);
            setIsLikingPending(false);
          },
        }
      );
    }
    setShowReactions(false);
  };

  if (isLoading)
    return (
      <MainLayout sidebar={<Sidebar />} topbar={<Topbar />}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#EC4899" }} />
        </div>
      </MainLayout>
    );

  if (!post)
    return (
      <MainLayout sidebar={<Sidebar />} topbar={<Topbar />}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <MessageSquareOff className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-900 dark:text-white">Post not found</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This post may have been deleted or is unavailable.
          </p>
        </div>
      </MainLayout>
    );

  const activeReactionData = reactions.find((r) => r.name === currentReaction);

  return (
    <MainLayout sidebar={<Sidebar />} topbar={<Topbar />}>
      <div className="max-w-5xl mx-auto p-3 sm:p-4">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-4 transition"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium hidden sm:inline">Back</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh]">
            {/* ── Media ── */}
            <div className="bg-black flex items-center justify-center min-h-64 lg:min-h-full">
              {post.media?.[0] ? (
                post.media[0].type === "image" ? (
                  <img
                    src={post.media[0].url}
                    alt="Post"
                    className="w-full h-full object-contain max-h-[70vh]"
                  />
                ) : (
                  <video
                    src={post.media[0].url}
                    controls
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div
                  className="w-full h-full min-h-64 flex items-center justify-center p-8"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899,#F97316)" }}
                >
                  <p className="text-white text-xl font-medium text-center">{processMentions(post.caption, currentUser?.blocked_usernames)}</p>
                </div>
              )}
            </div>

            {/* ── Content ── */}
            <div className="flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <Link
                  to={`/profile/${post.created_by?._id}`}
                  className="flex items-center gap-3"
                >
                  <img
                    src={post.created_by?.profile?.profile_picture || "/avatar.png"}
                    alt={post.created_by?.username}
                    className="w-10 h-10 rounded-full object-cover border-2"
                    style={{ borderColor: "#EC4899" }}
                  />
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      {post.created_by?.username}
                    </p>
                    <p className="text-xs text-slate-500">{formatTimeAgo(post.createdAt)}</p>
                  </div>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
                  >
                    <MoreHorizontal size={18} className="text-slate-500" />
                  </button>

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
                        {currentUser?._id === post.created_by?._id && (
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

              {/* Caption */}
              {post.caption && (
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {processMentions(post.caption, currentUser?.blocked_usernames)}
                  </p>
                </div>
              )}

              {/* Comments */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {commentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment._id}
                      comment={comment}
                      toggleLike={toggleLike}
                      currentUser={currentUser}
                      onReply={handleReply}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                      <MessageCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      No comments yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Be the first to comment!</p>
                  </div>
                )}
              </div>

              {/* Action Row */}
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 mb-3">
                  {/* Like / Reaction */}
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      reactionTimeoutRef.current = setTimeout(
                        () => setShowReactions(true),
                        500
                      );
                    }}
                    onMouseLeave={() => {
                      clearTimeout(reactionTimeoutRef.current);
                      setShowReactions(false);
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    onContextMenu={(e) => {
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
                        >
                          <div className="bg-white dark:bg-slate-800 shadow-xl rounded-full px-2 py-1.5 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
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
                                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
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
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(currentReaction || "like");
                      }}
                      className={`flex items-center gap-1.5 transition px-3 py-1.5 rounded-xl ${isLiked
                          ? `${activeReactionData?.color || "text-pink-500"} ${activeReactionData?.bg || "bg-pink-50"} dark:bg-opacity-20`
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                    >
                      {isLiked && currentReaction !== "like" ? (
                        <span className="text-xl">{activeReactionData?.emoji}</span>
                      ) : (
                        <Heart size={22} className={isLiked ? "fill-current" : ""} />
                      )}
                      <span className="text-sm font-bold">{likesCount}</span>
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <MessageCircle size={22} />
                    <span className="text-sm font-medium">{post.comments_count || 0}</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleShare}
                    className={`flex items-center gap-1.5 transition ${copied
                        ? "text-green-500"
                        : "text-slate-600 dark:text-slate-400 hover:text-orange-500"
                      }`}
                  >
                    {copied ? <Check size={20} /> : <Share2 size={20} />}
                    <span className="text-sm font-medium">{post.shares_count || 0}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggleBookmark}
                    className={`ml-auto transition ${isBookmarked
                        ? "text-yellow-500"
                        : "text-slate-600 dark:text-slate-400 hover:text-yellow-500"
                      }`}
                  >
                    <Bookmark size={22} className={isBookmarked ? "fill-yellow-500" : ""} />
                  </motion.button>
                </div>

                {/* Comment Input */}
                <div className="flex items-center gap-2">
                  <img
                    src={currentUser?.profile?.profile_picture || "/avatar.png"}
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 relative">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full pr-1">
                      <input
                        type="text"
                        placeholder="Add a comment…"
                        value={commentText}
                        onChange={handleCommentChange}
                        onKeyUp={(e) => setCursorPos(e.target.selectionStart)}
                        onBlur={() => setTimeout(() => setShowMentions(false), 200)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                        className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || sending}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-white disabled:opacity-40 transition"
                        style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}
                      >
                        {sending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {showMentions && (
                        <div className="absolute bottom-full left-0 mb-2 w-full max-w-[280px]">
                          <MentionSuggestions query={mentionQuery} onSelect={handleMentionSelect} />
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onSuccess={handleEditSuccess}
      />
    </MainLayout>
  );
};

export default PostDetail;