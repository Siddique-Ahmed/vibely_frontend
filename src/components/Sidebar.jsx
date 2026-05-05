import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import Avatar from "./Avatar";
import {
  Home, Search, Bell, MessageCircle, Bookmark,
  User, Settings, PlusCircle, LogOut,
} from "lucide-react";

const Sidebar = ({ onCreatePost }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDarkMode, unreadCount, unreadMessageCount } = useSelector((state) => state.ui);

  const navItems = [
    { name: "Home",          path: "/feed",                  icon: Home },
    { name: "Explore",       path: "/explore",               icon: Search },
    { name: "Notifications", path: "/notifications",         icon: Bell, badge: unreadCount },
    { name: "Messages",      path: "/messages",              icon: MessageCircle, badge: unreadMessageCount },
    { name: "Bookmarks",     path: "/bookmarks",             icon: Bookmark },
    { name: "Profile",       path: `/profile/${user?._id}`,  icon: User },
    { name: "Settings",      path: "/settings",              icon: Settings },
  ];

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = "/login";
  };

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full h-full flex flex-col overflow-y-auto"
      style={{
        background: isDarkMode
          ? "linear-gradient(180deg, #0f0117 0%, #130022 100%)"
          : "linear-gradient(180deg, #faf5ff 0%, #fff 100%)",
        borderRight: isDarkMode
          ? "1px solid rgba(124,58,237,0.2)"
          : "1px solid rgba(124,58,237,0.15)",
      }}
    >
      {/* ─── Logo ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 px-5 pt-6 pb-5"
      >
        {/* Gradient ring around logo */}
        <div
          className="relative flex-shrink-0"
          style={{
            padding: "2px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)",
            boxShadow: "0 0 18px rgba(124,58,237,0.4)",
          }}
        >
          <div
            className="w-10 h-10 rounded-[12px] overflow-hidden flex items-center justify-center"
            style={{ background: "#ffffff" }}
          >
            <img
              src="/vibely_logo.png"
              alt="Vibely"
              className="w-9 h-9 object-contain"
            />
          </div>
        </div>

        <div>
          <h1
            className="text-xl font-black leading-none tracking-tight"
            style={{
              background: "linear-gradient(90deg, #7C3AED, #EC4899, #F97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Vibely
          </h1>
          <p className="text-[10px] text-slate-400 leading-none mt-0.5 tracking-wide uppercase">
            Social &amp; Vibes
          </p>
        </div>
      </motion.div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item, idx) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + idx * 0.04 }}
          >
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group text-sm font-medium ${
                  isActive
                    ? "text-white"
                    : isDarkMode
                    ? "text-slate-400 hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-purple-50"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.15))",
                      borderLeft: "3px solid #EC4899",
                    }
                  : {}
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={19}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={
                      isActive
                        ? {
                            background:
                              "linear-gradient(135deg, #7C3AED, #EC4899)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            filter: "drop-shadow(0 0 6px rgba(236,72,153,0.5))",
                          }
                        : {}
                    }
                  />
                  <span>{item.name}</span>
                  {item.badge > 0 && (
                    <span
                      className="ml-auto text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1 shadow-sm"
                      style={{
                        background:
                          "linear-gradient(135deg, #7C3AED, #EC4899)",
                      }}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* ─── Create Post ─── */}
      <div className="px-3 mt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCreatePost}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg mb-3 transition"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)",
            boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
          }}
        >
          <PlusCircle size={17} strokeWidth={2.5} />
          Create Post
        </motion.button>

      </div>

      {/* ─── User Card ─── */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mx-3 mb-5 p-3 rounded-2xl"
          style={{
            background: isDarkMode
              ? "rgba(124,58,237,0.1)"
              : "rgba(124,58,237,0.06)",
            border: isDarkMode
              ? "1px solid rgba(124,58,237,0.25)"
              : "1px solid rgba(124,58,237,0.15)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <Avatar
                profilePicture={user?.profile?.profile_picture}
                fullName={user?.profile?.full_name}
                username={user?.username}
                size="md"
                className="border-2 border-pink-500"
              />
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{
                  background: "#22c55e",
                  borderColor: isDarkMode ? "#0f0117" : "#fff",
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-bold truncate"
                style={{ color: isDarkMode ? "#f0e6ff" : "#1e1b4b" }}
              >
                {user?.profile?.full_name || user?.username}
              </p>
              <p className="text-xs text-slate-400 truncate">
                @{user?.username}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-xl font-semibold transition"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
            }}
          >
            <LogOut size={13} strokeWidth={2.5} />
            Logout
          </motion.button>
        </motion.div>
      )}
    </motion.aside>
  );
};

export default Sidebar;
