import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useBookmarks } from "../hooks/useApi";
import MainLayout from "../components/layouts/MainLayout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import PostCard from "../components/posts/PostCard";
import {
  Bookmark, Loader2, ImageIcon, TrendingUp,
} from "lucide-react";

const Bookmarks = () => {
  const { user: currentUser } = useSelector((s) => s.auth);
  const { data: bookmarksData, isLoading } = useBookmarks(1, 50);

  const posts = bookmarksData?.data?.bookmarks || bookmarksData?.bookmarks || [];

  return (
    <MainLayout sidebar={<Sidebar />} topbar={<Topbar />}>
      <div className="max-w-4xl mx-auto px-3 py-4 sm:px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
            <Bookmark size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bookmarks</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Posts you've saved for later</p>
          </div>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#F59E0B" }} />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading your bookmarks...</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, idx) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
              <Bookmark className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No bookmarks yet</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-8">
              Save posts you love to see them here later! Tap the bookmark icon on any post to save it.
            </p>
            <Link
              to="/feed"
              className="px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
            >
              Explore Feed
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Bookmarks;
