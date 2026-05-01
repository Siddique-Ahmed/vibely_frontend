import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import { useToggleFollow, useUpdateProfile, useUpdatePrivacySettings, useBookmarks, useNotificationPreferences, useUpdateNotificationPreferences } from "../hooks/useApi";
import apiClient from "../services/apiClient";
import MainLayout from "../components/layouts/MainLayout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import CreatePostModal from "../components/CreatePostModal";
import ImageLightbox from "../components/ImageLightbox";
import BlockReportModal from "../components/BlockReportModal";
import {
  Grid3X3, Bookmark, Heart, MessageCircle, UserPlus, UserCheck,
  MessageSquare, Camera, MapPin, Link2, CalendarDays, Loader2,
  PlusSquare, ImageOff, X, Save, Edit3, MoreHorizontal, Lock, Users,
  Bell, BellOff, MessageCircleHeart, Heart as UserHeart, AtSign, ImageIcon,
} from "lucide-react";

/* ── Edit Profile Modal ─────────────────────────────────────── */
const EditProfileModal = ({ profile, onClose, onSaved }) => {
  const dispatch = useDispatch();
  const { mutate: updateProfile, isPending: isProfilePending } = useUpdateProfile();
  const { mutate: updatePrivacy, isPending: isPrivacyPending } = useUpdatePrivacySettings();
  const avatarRef = useRef();
  const coverRef  = useRef();

  const [form, setForm] = useState({
    full_name:    profile?.profile?.full_name  || "",
    bio:          profile?.profile?.bio        || "",
    address:      profile?.profile?.address    || "",
    website:      profile?.profile?.website    || "",
    gender:       profile?.profile?.gender     || "",
    username:     profile?.username            || "",
  });
  const [privacyForm, setPrivacyForm] = useState({
    is_private:   profile?.is_private          || false,
    allow_follow: profile?.allow_follow        ?? true,
    message_privacy: profile?.message_privacy   || "everyone",
    who_can_see_followers: profile?.who_can_see_followers || "everyone",
    who_can_see_following: profile?.who_can_see_following || "everyone",
  });
  const [avatarPreview, setAvatarPreview] = useState(profile?.profile?.profile_picture || null);
  const [coverPreview,  setCoverPreview]  = useState(profile?.profile?.cover_picture   || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile,  setCoverFile]  = useState(null);

  const isPending = isProfilePending || isPrivacyPending;

  const pick = (file, type) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "avatar") { setAvatarFile(file); setAvatarPreview(url); }
    else                   { setCoverFile(file);  setCoverPreview(url);  }
  };

  const handleSave = () => {
    // Update profile data (non-privacy fields)
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== undefined) fd.append(k, v); });
    if (avatarFile) fd.append("profile_picture", avatarFile);
    if (coverFile)  fd.append("cover_picture",   coverFile);
    
    updateProfile(fd, {
      onSuccess: (res) => {
        const updated = res?.data || res;
        dispatch(setUser(updated));
        onSaved(updated);
      },
    });

    // Update privacy settings
    updatePrivacy(privacyForm, {
      onSuccess: (res) => {
        const updatedPrivacy = res?.data || res;
        dispatch(setUser({ ...profile, ...updatedPrivacy }));
        onSaved({ ...profile, ...updatedPrivacy });
        onClose();
      },
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Profile</h2>
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl transition disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                {isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {isPending ? "Saving…" : "Save"}
              </motion.button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
          </div>

          {/* Cover Photo */}
          <div className="relative h-36 cursor-pointer" onClick={() => coverRef.current?.click()}
            style={{ background: coverPreview ? undefined : "linear-gradient(135deg,#4C1D95,#7C3AED,#EC4899,#F97316)" }}>
            {coverPreview && <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="flex items-center gap-2 text-white text-sm font-medium bg-black/40 px-3 py-1.5 rounded-lg">
                <Camera size={14} /> Change Cover
              </div>
            </div>
            <input ref={coverRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => pick(e.target.files?.[0], "cover")} />
          </div>

          {/* Avatar */}
          <div className="px-5 pb-2 -mt-10 relative z-10">
            <div className="relative w-20 h-20 cursor-pointer" onClick={() => avatarRef.current?.click()}>
              <img src={avatarPreview || "/avatar.png"} alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-lg" />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                <Camera size={18} className="text-white" />
              </div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => pick(e.target.files?.[0], "avatar")} />
            </div>
          </div>

          {/* Form Fields */}
          <div className="px-5 pb-6 space-y-4 mt-3">
            {[
              { label: "Full Name",  key: "full_name", type: "text",  placeholder: "Your full name" },
              { label: "Username",   key: "username",  type: "text",  placeholder: "username" },
              { label: "Website",    key: "website",   type: "url",   placeholder: "https://yoursite.com" },
              { label: "Location",   key: "address",   type: "text",  placeholder: "City, Country" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">{label}</label>
                <input type={type} value={form[key]} placeholder={placeholder}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Bio</label>
              <textarea rows={3} value={form.bio} placeholder="Tell people about yourself…"
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                maxLength={150}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition resize-none" />
              <p className="text-xs text-slate-400 text-right mt-0.5">{form.bio.length}/150</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Gender</label>
              <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition">
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Privacy Toggle */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock size={14} className="text-slate-500" />
                    Private Account
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Only followers can see your posts
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPrivacyForm((p) => ({ ...p, is_private: !p.is_private }))}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    privacyForm.is_private
                      ? "bg-purple-600"
                      : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <motion.div
                    animate={{ x: privacyForm.is_private ? 28 : 2 }}
                    className="w-6 h-6 bg-white rounded-full shadow-md"
                  />
                </motion.button>
              </div>
            </div>

            {/* Allow Follow Toggle */}
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={14} className="text-slate-500" />
                  Allow Others to Follow
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  People can follow your account
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPrivacyForm((p) => ({ ...p, allow_follow: !p.allow_follow }))}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  privacyForm.allow_follow
                    ? "bg-purple-600"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <motion.div
                  animate={{ x: privacyForm.allow_follow ? 28 : 2 }}
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                />
              </motion.button>
            </div>

            {/* Message Privacy */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                Who can message you
              </label>
              <select
                value={privacyForm.message_privacy}
                onChange={(e) => setPrivacyForm((p) => ({ ...p, message_privacy: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
              >
                <option value="everyone">Everyone</option>
                <option value="followers">Followers only</option>
                <option value="no_one">No one</option>
              </select>
            </div>

            {/* Followers Visibility */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                Who can see your followers
              </label>
              <select
                value={privacyForm.who_can_see_followers}
                onChange={(e) => setPrivacyForm((p) => ({ ...p, who_can_see_followers: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
              >
                <option value="everyone">Everyone</option>
                <option value="followers">Followers only</option>
                <option value="no_one">Only me</option>
              </select>
            </div>

            {/* Following Visibility */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                Who can see your following
              </label>
              <select
                value={privacyForm.who_can_see_following}
                onChange={(e) => setPrivacyForm((p) => ({ ...p, who_can_see_following: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
              >
                <option value="everyone">Everyone</option>
                <option value="followers">Followers only</option>
                <option value="no_one">Only me</option>
              </select>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ── Notification Settings Modal ───────────────────────────── */
const NotificationSettingsModal = ({ preferences, onClose, onSaved }) => {
  const { data, isLoading } = useNotificationPreferences();
  const { mutate: updatePreferences, isPending } = useUpdateNotificationPreferences();

  const [settings, setSettings] = useState(
    preferences?.notification_preferences || 
    data?.data || 
    {
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      posts: true,
      messages: true,
    }
  );

  const handleSave = () => {
    updatePreferences(settings, {
      onSuccess: (res) => {
        const updated = res?.data || res;
        onSaved(updated);
        onClose();
      },
    });
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationTypes = [
    { key: "likes", label: "Likes", description: "When someone likes your post", icon: Heart },
    { key: "comments", label: "Comments", description: "When someone comments on your post", icon: MessageCircle },
    { key: "follows", label: "Follows", description: "When someone follows you", icon: UserPlus },
    { key: "mentions", label: "Mentions", description: "When someone mentions you", icon: AtSign },
    { key: "posts", label: "New Posts", description: "When someone you follow posts", icon: ImageIcon },
    { key: "messages", label: "Messages", description: "When you receive a new message", icon: MessageCircleHeart },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Settings</h2>
            </div>
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl transition disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                {isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {isPending ? "Saving…" : "Save"}
              </motion.button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
          </div>

          {/* Notification Settings List */}
          <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
            {notificationTypes.map(({ key, label, description, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Icon size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSetting(key)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings[key]
                      ? "bg-purple-600"
                      : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <motion.div
                    animate={{ x: settings[key] ? 28 : 2 }}
                    className="w-6 h-6 bg-white rounded-full shadow-md"
                  />
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ── User List Modal (Followers/Following) ─────────────────── */
const UserListModal = ({ title, userId, type, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const endpoint = type === "followers" ? `/follow/followers/${userId}` : `/follow/following/${userId}`;
        const res = await apiClient.get(endpoint);
        const data = res.data?.data || res.data;
        // In the backend services, we return { followers: [...] } or { following: [...] }
        setUsers(data[type] || data.users || []);
      } catch (err) {
        console.error("Fetch users error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [userId, type]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-1">
                {users.map((u) => (
                  <Link
                    key={u._id}
                    to={`/profile/${u._id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <img
                      src={u.profile?.profile_picture || "/avatar.png"}
                      alt={u.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {u.profile?.full_name || u.username}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No {type} yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ── SavedTab — loads bookmarks from API ─────────────────────── */
const SavedTab = () => {
  const { data, isLoading } = useBookmarks(1, 30);
  const posts = data?.data?.posts ?? data?.data?.bookmarks ?? data?.bookmarks ?? [];

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#EC4899" }} />
    </div>
  );

  if (posts.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Bookmark className="w-9 h-9 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No saved posts</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">Posts you bookmark will appear here.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {posts.map((post, idx) => (
        <motion.div key={post._id} initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}
          className="group relative overflow-hidden rounded-xl aspect-square bg-slate-200 dark:bg-slate-800 cursor-pointer">
          <Link to={`/post/${post._id}`}>
            {post.media?.[0] ? (
              post.media[0].type === "image"
                ? <img src={post.media[0].url} alt="Saved" className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
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
      ))}
    </div>
  );
};

/* ── Main Profile Component ─────────────────────────────────── */
const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { mutate: toggleFollow } = useToggleFollow();

  const [profile,         setProfile]         = useState(null);
  const [userPosts,       setUserPosts]        = useState([]);
  const [loading,         setLoading]          = useState(true);
  const [isFollowing,     setIsFollowing]      = useState(false);
  const [activeTab,       setActiveTab]        = useState("posts");
  const [showCreate,      setShowCreate]       = useState(false);
  const [showEdit,        setShowEdit]         = useState(false);
  const [lightboxSrc,     setLightboxSrc]      = useState(null);
  const [showBlockReport, setShowBlockReport]  = useState(false);
  const [showMoreMenu,    setShowMoreMenu]      = useState(false);
  const [userList,        setUserList]          = useState(null); // { title, type }
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const isOwn = currentUser?._id === userId;

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // 1. Fetch profile info
      const pRes = await apiClient.get(`/users/user-profile/${userId}`);
      const pData = pRes.data?.data || pRes.data?.user || pRes.data;
      setProfile(pData);

      // 2. Fetch posts — always use /users/posts/:userId (works for own + others)
      try {
        const postRes = await apiClient.get(`/users/posts/${userId}`, { params: { page: 1, limit: 20 } });
        setUserPosts(postRes.data?.data?.posts || postRes.data?.posts || []);
      } catch { setUserPosts([]); }

      // 3. Follow status (only for other users)
      if (currentUser?._id !== userId) {
        setIsFollowing(pData.isFollowing || false);
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (userId) fetchProfile(); }, [userId, currentUser?._id]);

  const handleFollow = () => {
    const wasFollowing = isFollowing;
    // Optimistic UI update
    setIsFollowing(!wasFollowing);
    setProfile((p) => p ? {
      ...p,
      followers_count: wasFollowing
        ? Math.max(0, (p.followers_count || 1) - 1)
        : (p.followers_count || 0) + 1,
    } : p);
    // Server call — revert on error
    toggleFollow(userId, {
      onError: () => {
        setIsFollowing(wasFollowing);
        setProfile((p) => p ? {
          ...p,
          followers_count: wasFollowing
            ? (p.followers_count || 0) + 1
            : Math.max(0, (p.followers_count || 1) - 1),
        } : p);
      },
    });
  };

  // Check if profile is private and user is not a follower
  const isPrivateAndNotFollower = profile?.is_private && !isOwn && !isFollowing;

  const tabs = [
    { key: "posts", label: "Posts",  icon: Grid3X3 },
    ...(isOwn ? [{ key: "saved", label: "Saved",  icon: Bookmark }] : []),
  ];

  if (loading) return (
    <MainLayout sidebar={<Sidebar />} topbar={<Topbar />}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#EC4899" }} />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading profile…</p>
      </div>
    </MainLayout>
  );

  const hasCover = !!profile?.profile?.cover_picture;

  return (
    <MainLayout
      sidebar={<Sidebar onCreatePost={() => setShowCreate(true)} />}
      topbar={<Topbar onCreatePost={() => setShowCreate(true)} />}
    >
      <div className="max-w-4xl mx-auto">

        {/* ── Cover Image ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
          <div className="h-44 sm:h-56 relative overflow-hidden"
            style={hasCover ? undefined : { background: "linear-gradient(135deg,#4C1D95 0%,#7C3AED 35%,#EC4899 70%,#F97316 100%)" }}>
            {hasCover && (
              <img src={profile.profile.cover_picture} alt="Cover"
                onClick={() => setLightboxSrc(profile.profile.cover_picture)}
                className="w-full h-full object-cover cursor-zoom-in" />
            )}
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle at 20px 20px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
            {isOwn && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowEdit(true)}
                className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/30 hover:bg-black/50 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition">
                <Camera size={13} /> Edit Cover
              </motion.button>
            )}
          </div>

          {/* ── Profile Card ── */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 pb-4">
            <div className="flex items-end justify-between mb-4">
              {/* Avatar */}
              <div className="relative -mt-16 sm:-mt-20">
                <div className="relative">
                  <img
                    src={profile?.profile?.profile_picture || "/avatar.png"}
                    alt={profile?.username}
                    onClick={() => profile?.profile?.profile_picture && setLightboxSrc(profile.profile.profile_picture)}
                    className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl ${profile?.profile?.profile_picture ? "cursor-zoom-in" : ""}`}
                  />
                  {isOwn && (
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setShowEdit(true)}
                      className="absolute bottom-1 right-1 w-8 h-8 text-white rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                      <Camera size={14} />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pb-1">
                {isOwn ? (
                  <>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setShowEdit(true)}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl font-medium text-sm transition">
                      <Edit3 size={15} />
                      <span className="hidden sm:inline">Edit Profile</span>
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCreate(true)}
                      className="flex items-center gap-2 px-4 py-2 text-white rounded-xl font-medium text-sm transition"
                      style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899,#F97316)", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}>
                      <PlusSquare size={15} />
                      <span className="hidden sm:inline">New Post</span>
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setShowNotificationSettings(true)}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl font-medium text-sm transition">
                      <Bell size={15} />
                      <span className="hidden sm:inline">Notifications</span>
                    </motion.button>
                  </>
                ) : (
                  <>
                    {(profile?.allow_follow !== false || isFollowing) && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={handleFollow}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-sm transition ${isFollowing ? "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white" : "text-white"}`}
                        style={!isFollowing ? { background: "linear-gradient(135deg,#7C3AED,#EC4899)", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" } : {}}>
                        {isFollowing ? <><UserCheck size={15} /> Following</> : <><UserPlus size={15} /> Follow</>}
                      </motion.button>
                    )}

                    {/* Message Button - hidden if privacy is 'no_one' or if 'followers' and not following */}
                    {profile?.message_privacy !== "no_one" && (profile?.message_privacy !== "followers" || isFollowing) && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl font-medium text-sm transition">
                        <MessageSquare size={15} />
                        <span className="hidden sm:inline">Message</span>
                      </motion.button>
                    )}
                    {/* ── More (Block / Report) ── */}
                    <div className="relative">
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => setShowMoreMenu((v) => !v)}
                        className="p-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition">
                        <MoreHorizontal size={18} />
                      </motion.button>
                      <AnimatePresence>
                        {showMoreMenu && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute right-0 top-11 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-30 min-w-[160px]"
                          >
                            <button
                              onClick={() => { setShowMoreMenu(false); setShowBlockReport(true); }}
                              className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition">
                              Block / Report
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="mb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none">
                {profile?.profile?.full_name || profile?.username}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">@{profile?.username}</p>
              {profile?.profile?.bio && (
                <p className="text-slate-700 dark:text-slate-300 mt-3 text-sm leading-relaxed max-w-lg">{profile.profile.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
                {profile?.profile?.address && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin size={13} /> {profile.profile.address}
                  </div>
                )}
                {profile?.profile?.website && (
                  <a href={profile.profile.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-purple-600 hover:underline">
                    <Link2 size={13} /> {profile.profile.website.replace(/https?:\/\//, "")}
                  </a>
                )}
                {profile?.createdAt && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <CalendarDays size={13} />
                    Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 border-t border-slate-100 dark:border-slate-800 pt-4">
              {[
                { label: "Posts",     value: userPosts.length, onClick: null },
                { 
                  label: "Followers", 
                  value: profile?.followers_count || 0, 
                  onClick: (isOwn || profile?.who_can_see_followers === "everyone" || (profile?.who_can_see_followers === "followers" && isFollowing)) 
                    ? () => setUserList({ title: "Followers", type: "followers" }) 
                    : null 
                },
                { 
                  label: "Following", 
                  value: profile?.following_count || 0, 
                  onClick: (isOwn || profile?.who_can_see_following === "everyone" || (profile?.who_can_see_following === "followers" && isFollowing)) 
                    ? () => setUserList({ title: "Following", type: "following" }) 
                    : null 
                },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={stat.onClick ? { scale: 1.05 } : {}}
                  onClick={stat.onClick}
                  className={`text-center ${stat.onClick ? "cursor-pointer" : "cursor-default"}`}
                >
                  <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                    {stat.value >= 1000 ? `${(stat.value / 1000).toFixed(1)}K` : stat.value}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="bg-white dark:bg-slate-900 sticky top-[60px] z-20 border-b border-slate-200 dark:border-slate-800">
          <div className="flex">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.key
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}>
                <tab.icon size={16} strokeWidth={activeTab === tab.key ? 2.5 : 1.8} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Privacy Notice ── */}
        {isPrivateAndNotFollower && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-3 sm:mx-4 mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-3"
          >
            <Lock size={20} className="text-slate-500 dark:text-slate-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                This account is private
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Follow to see their posts and interactions
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Posts Grid ── */}
        <div className="p-3 sm:p-4">
          {activeTab === "posts" && (
            <>
              {isPrivateAndNotFollower ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lock size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    Posts are hidden from non-followers
                  </p>
                </div>
              ) : userPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  {userPosts.map((post, idx) => (
                    <motion.div key={post._id} initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}
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
                  ))}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <ImageOff className="w-9 h-9 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {isOwn ? "Share your first post" : "No posts yet"}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mb-5">
                    {isOwn ? "Start sharing photos and moments with your followers." : "When they post, you'll see it here."}
                  </p>
                  {isOwn && (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCreate(true)}
                      className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl font-medium transition"
                      style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899,#F97316)", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}>
                      <PlusSquare size={16} /> Create Post
                    </motion.button>
                  )}
                </motion.div>
              )}
            </>
          )}

          {activeTab === "saved" && (
            <SavedTab />
          )}
        </div>
      </div>

      <CreatePostModal isOpen={showCreate} onClose={() => setShowCreate(false)} />

      {showEdit && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setProfile((p) => ({ ...p, ...updated, profile: { ...p?.profile, ...updated?.profile } }))}
        />
      )}

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <NotificationSettingsModal
          preferences={profile}
          onClose={() => setShowNotificationSettings(false)}
          onSaved={(updated) => setProfile((p) => ({ ...p, notification_preferences: updated }))}
        />
      )}

      {/* Image Lightbox */}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={profile?.username}
          onClose={() => setLightboxSrc(null)}
        />
      )}

      {/* Block / Report Modal */}
      {showBlockReport && profile && (
        <BlockReportModal
          targetUser={profile}
          onClose={() => setShowBlockReport(false)}
          onBlockSuccess={() => {
            setShowBlockReport(false);
            fetchProfile(); // refresh after block
          }}
        />
      )}

      {/* User List Modal */}
      {userList && (
        <UserListModal
          title={userList.title}
          type={userList.type}
          userId={userId}
          onClose={() => setUserList(null)}
        />
      )}
    </MainLayout>
  );
};

export default Profile;
