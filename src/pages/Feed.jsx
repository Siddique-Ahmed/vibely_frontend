import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  usePosts, useFeedPosts, useToggleLike, useSharePost,
} from "../hooks/useApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../services/apiClient";
import PostCard from "../components/posts/PostCard";
import MainLayout from "../components/layouts/MainLayout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import CreatePostModal from "../components/CreatePostModal";
import Avatar from "../components/Avatar";
import {
  Image, Smile, MapPin, Loader2, AlertCircle,
  RefreshCw, Newspaper, Users, Globe, UserCheck,
} from "lucide-react";

// Individual tab fetch hooks
const useFollowingPosts = (page = 1, limit = 10) =>
  useQuery({
    queryKey: ["followingPosts", page, limit],
    queryFn: () =>
      apiClient.get("/posts/following/post", { params: { page, limit } }).then((r) => r.data),
  });

const useFollowerPosts = (page = 1, limit = 10) =>
  useQuery({
    queryKey: ["followerPosts", page, limit],
    queryFn: () =>
      apiClient.get("/posts/follower/post", { params: { page, limit } }).then((r) => r.data),
  });

const TABS = [
  { key: "all",       label: "All Posts",  icon: Globe      },
  { key: "following", label: "Following",  icon: UserCheck  },
  { key: "followers", label: "Followers",  icon: Users      },
];

const Feed = () => {
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Fetch based on active tab
  const allQuery       = usePosts(page, 10);
  const followingQuery = useFollowingPosts(page, 10);
  const followerQuery  = useFollowerPosts(page, 10);

  const { mutate: toggleLike } = useToggleLike();
  const { mutate: sharePost }  = useSharePost();

  // Pick active query
  const activeQuery =
    activeTab === "all"       ? allQuery :
    activeTab === "following" ? followingQuery :
                                followerQuery;

  const { data, isLoading, error, refetch } = activeQuery;

  const posts      = data?.data?.posts ?? data?.posts ?? [];
  const pagination = data?.data?.pagination ?? data?.pagination ?? {};

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handlePostCreated = useCallback(() => {
    // Invalidate all feed caches so new post appears immediately
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    queryClient.invalidateQueries({ queryKey: ["followingPosts"] });
    queryClient.invalidateQueries({ queryKey: ["followerPosts"] });
    queryClient.invalidateQueries({ queryKey: ["feedPosts"] });
    queryClient.invalidateQueries({ queryKey: ["myPosts"] });
  }, [queryClient]);

  const handleLike = (postId) =>
    toggleLike({ targetId: postId, targetType: "Post", reactionType: "like" });

  const handleShare = (postId) => {
    // Call API to increment share counter
    sharePost(postId);
    // Also copy link to clipboard
    const url = `${window.location.origin}/post/${postId}`;
    if (navigator.share) {
      navigator.share({ url }).catch(() => navigator.clipboard.writeText(url));
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <MainLayout
      sidebar={<Sidebar onCreatePost={() => setShowCreatePost(true)} />}
      topbar={<Topbar onCreatePost={() => setShowCreatePost(true)} />}
    >
      <div className="max-w-xl mx-auto px-3 py-4 sm:px-4">

        {/* ── Create Post Box ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Link to={`/profile/${user?._id}`}>
              <Avatar
                profilePicture={user?.profile?.profile_picture}
                fullName={user?.profile?.full_name}
                username={user?.username}
                size="md"
                className="border-2 border-slate-200 dark:border-slate-700"
              />
            </Link>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowCreatePost(true)}
              className="flex-1 text-left bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 transition cursor-pointer">
              What's on your mind, {user?.profile?.full_name?.split(" ")[0] || user?.username}?
            </motion.button>
          </div>
          <div className="flex gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            {[
              { icon: Image,  label: "Photo/Video", color: "text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20" },
              { icon: Smile,  label: "Feeling",     color: "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20" },
              { icon: MapPin, label: "Location",    color: "text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20" },
            ].map(({ icon: Icon, label, color }) => (
              <motion.button key={label} whileTap={{ scale: 0.96 }} onClick={() => setShowCreatePost(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium ${color} rounded-xl transition`}>
                <Icon size={17} strokeWidth={2} /> {label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Feed Tabs ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 overflow-hidden">
          <div className="flex">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs sm:text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.key
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}>
                <tab.icon size={15} strokeWidth={activeTab === tab.key ? 2.5 : 1.8} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Posts ── */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#EC4899" }} />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading posts…</p>
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <p className="font-semibold text-slate-900 dark:text-white">Failed to load posts</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{error?.response?.data?.message || "Something went wrong"}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => refetch()}
                className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium transition"
                style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}>
                <RefreshCw size={15} /> Try Again
              </motion.button>
            </motion.div>
          ) : posts.length > 0 ? (
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {posts.map((post, idx) => (
                <motion.div key={post._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}>
                  <PostCard post={post} onLike={handleLike} onShare={handleShare} />
                </motion.div>
              ))}
              {pagination?.hasNextPage && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-full py-3 mt-2 mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 rounded-2xl font-medium transition shadow-sm">
                  Load More Posts
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Newspaper className="w-9 h-9 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {activeTab === "all" ? "No posts yet" : `No ${activeTab} posts`}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mb-6">
                {activeTab === "all"
                  ? "Be the first to post something!"
                  : `Follow people to see their posts here.`}
              </p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreatePost(true)}
                className="px-6 py-2.5 text-white rounded-xl font-medium transition"
                style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899,#F97316)", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}>
                Create Your First Post
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSuccess={handlePostCreated}
      />
    </MainLayout>
  );
};

export default Feed;
