import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useToggleFollow } from "../hooks/useApi";
import apiClient from "../services/apiClient";
import MainLayout from "../components/layouts/MainLayout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  TrendingUp, Heart, MessageCircle, Loader2, Edit3,
  ImageIcon,
  Users,
  Search,
  UserCheck,
  UserPlus,
} from "lucide-react";
import Avatar from "../components/Avatar";

const Explore = () => {
  const { user: currentUser } = useSelector((s) => s.auth);
  const [users,         setUsers]         = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [posts,         setPosts]         = useState([]);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [activeTab,     setActiveTab]     = useState("posts");
  const [loading,       setLoading]       = useState(false);
  // followingMap: { [userId]: boolean }
  const [followingMap,  setFollowingMap]  = useState({});
  const { mutate: toggleFollow } = useToggleFollow();

  // Fetch trending posts on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/posts", { params: { limit: 30 } });
        const fetched = res.data?.data?.posts || res.data?.posts || [];
        setTrendingPosts(fetched);
        setPosts(fetched);
      } catch (e) {
        console.error("Trending error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setUsers([]);
      setPosts(trendingPosts);
      return;
    }
    setLoading(true);
    try {
      if (activeTab === "users") {
        const res = await apiClient.get("/users/search-user", {
          params: { query, limit: 20 },
        });
        const found = res.data?.data?.users || res.data?.users || [];
        setUsers(found);

        // Map isFollowing state for each user
        const newMapping = {};
        found.forEach((u) => {
          newMapping[u._id] = u.isFollowing || false;
        });
        setFollowingMap((prev) => ({ ...prev, ...newMapping }));
      } else {
        const res = await apiClient.get("/posts", {
          params: { search: query, limit: 20 },
        });
        setPosts(res.data?.data?.posts || res.data?.posts || []);
      }
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (searchQuery) {
      // re-run search for new tab
      setTimeout(() => handleSearch(searchQuery), 0);
    }
  };

  const handleFollowToggle = (userId) => {
    toggleFollow(userId, {
      onSuccess: () => {
        setFollowingMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
      },
    });
    // Optimistic update
    setFollowingMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const displayPosts = searchQuery ? posts : trendingPosts;

  const tabs = [
    { key: "posts", label: "Posts",  icon: ImageIcon },
    { key: "users", label: "People", icon: Users },
  ];

  return (
    <MainLayout sidebar={<Sidebar />} topbar={<Topbar />}>
      <div className="max-w-4xl mx-auto px-3 py-4 sm:px-4">

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users, posts..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:text-white dark:placeholder-slate-400 shadow-sm transition"
            />
            {loading && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5">
          {tabs.map((tab) => (
            <motion.button key={tab.key} whileTap={{ scale: 0.97 }}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key ? "text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              style={activeTab === tab.key ? { background: "linear-gradient(135deg,#7C3AED,#EC4899)" } : {}}>
              <tab.icon size={15} strokeWidth={2} />
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#EC4899" }} />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {searchQuery ? "Searching..." : "Loading..."}
            </p>
          </div>
        ) : activeTab === "users" ? (

          /* ── Users List ── */
          <div className="space-y-3">
            {users.length > 0 ? users.map((u, idx) => {
              const isSelf      = u._id === currentUser?._id;
              const isFollowing = followingMap[u._id] ?? false;

              return (
                <motion.div key={u._id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
                  <Link to={`/profile/${u._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar
                      profilePicture={u.profile?.profile_picture}
                      fullName={u.profile?.full_name}
                      username={u.username}
                      size="md"
                      className="w-12 h-12 border-2 border-slate-100 dark:border-slate-800 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {u.profile?.full_name || u.username}
                      </p>
                      <p className="text-sm text-slate-500 truncate">@{u.username}</p>
                      {u.followers_count !== undefined && (
                        <p className="text-xs text-slate-400 mt-0.5">{u.followers_count} followers</p>
                      )}
                    </div>
                  </Link>

                  {/* Own profile → Edit Profile button */}
                  {isSelf ? (
                    <Link to="/settings"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition ml-3 flex-shrink-0">
                      <Edit3 size={14} /> Edit Profile
                    </Link>
                  ) : (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleFollowToggle(u._id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm transition ml-3 flex-shrink-0 ${
                        isFollowing
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                          : "text-white"
                      }`}
                      style={!isFollowing ? { background: "linear-gradient(135deg,#7C3AED,#EC4899)", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" } : {}}>
                      {isFollowing
                        ? <><UserCheck size={14} strokeWidth={2.5} /> Following</>
                        : <><UserPlus  size={14} strokeWidth={2.5} /> Follow</>}
                    </motion.button>
                  )}
                </motion.div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {searchQuery ? "No users found" : "Search for people"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery ? `No results for "${searchQuery}"` : "Type a name or username to find people"}
                </p>
              </div>
            )}
          </div>

        ) : (

          /* ── Posts Grid ── */
          <div>
            {!searchQuery && (
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-orange-500" />
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Trending Posts</h2>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {displayPosts.length > 0 ? displayPosts.map((post, idx) => (
                <motion.div key={post._id} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group relative overflow-hidden rounded-xl aspect-square bg-slate-200 dark:bg-slate-800 cursor-pointer">
                  <Link to={`/post/${post._id}`}>
                    {post.media?.[0] ? (
                      post.media[0].type === "image"
                        ? <img src={post.media[0].url} alt="Post" className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                        : <video src={post.media[0].url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3"
                        style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899,#F97316)" }}>
                        <p className="text-white text-xs text-center font-medium line-clamp-4">{post.caption}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition duration-300 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-1 text-white">
                        <Heart size={16} className="fill-white" />
                        <span className="text-sm font-semibold">{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white">
                        <MessageCircle size={16} className="fill-white" />
                        <span className="text-sm font-semibold">{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )) : (
                <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <ImageIcon className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {searchQuery ? "No posts found" : "No posts yet"}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {searchQuery ? `No results for "${searchQuery}"` : "Be the first to post!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Explore;
