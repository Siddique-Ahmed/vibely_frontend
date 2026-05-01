import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useUnreadCount } from "../hooks/useApi";
import { toggleDarkMode } from "../redux/slices/uiSlice";
import { logout } from "../redux/slices/authSlice";
import apiClient from "../services/apiClient";
import {
  Search,
  Bell,
  MessageCircle,
  Sun,
  Moon,
  LogOut,
  X,
  Loader2,
  ChevronDown,
  Settings,
  User,
} from "lucide-react";

const Topbar = ({ onCreatePost }) => {
  const { user } = useSelector((state) => state.auth);
  const { isDarkMode } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: unreadData } = useUnreadCount();
  const [showSearch, setShowSearch] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  const unreadCount = unreadData?.data?.unreadCount || 0;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    setIsSearching(true);
    setShowSearch(true);
    try {
      const response = await apiClient.get("/users/search-user", {
        params: { query, limit: 6 },
      });
      const users = response.data?.data?.users || response.data?.users || [];
      setSearchResults(users);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = "/login";
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative"
    >
      <div className="h-[60px] max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile Logo */}
        <Link to="/feed" className="md:hidden flex items-center gap-1.5 flex-shrink-0">
          <div
            style={{
              padding: "2px",
              borderRadius: "11px",
              background: "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)",
            }}
          >
            <div
              className="w-7 h-7 rounded-[9px] overflow-hidden flex items-center justify-center"
              style={{ background: "#ffffff" }}
            >
              <img src="/vibely_logo.png" alt="Vibely" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <span
            className="text-base sm:text-lg font-black"
            style={{
              background: "linear-gradient(90deg, #7C3AED, #EC4899, #F97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Vibely
          </span>
        </Link>

        {/* Desktop Search */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:text-white dark:placeholder-slate-400 transition"
            />
            {isSearching && (
              <Loader2
                size={15}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
              />
            )}
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {showSearch && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                className="absolute top-12 left-0 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
              >
                {searchResults.map((u, idx) => (
                  <Link
                    key={u._id}
                    to={`/profile/${u._id}`}
                    onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    <img
                      src={u.profile?.profile_picture || "/avatar.png"}
                      alt={u.username}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                        {u.profile?.full_name || u.username}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Mobile Search Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileSearch(!mobileSearch)}
            className="md:hidden p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-600 dark:text-slate-300"
          >
            {mobileSearch ? <X size={18} /> : <Search size={18} />}
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/notifications")}
            className="relative p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-600 dark:text-slate-300"
          >
            <Bell size={18} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 text-white text-[9px] rounded-full min-w-[16px] h-4 flex items-center justify-center font-bold px-0.5"
                style={{ background: "linear-gradient(135deg, #EC4899, #F97316)" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>

          {/* Messages */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={()=>navigate("/messages")}
            className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-600 dark:text-slate-300"
          >
            <MessageCircle size={18} strokeWidth={1.8} />
          </motion.button>

          {/* Dark Mode */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => dispatch(toggleDarkMode())}
            className="hidden sm:flex p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-600 dark:text-slate-300"
          >
            {isDarkMode ? <Sun size={20} strokeWidth={1.8} /> : <Moon size={20} strokeWidth={1.8} />}
          </motion.button>

          {/* User Menu */}
          <div ref={userMenuRef} className="relative ml-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
            >
              <img
                src={user?.profile?.profile_picture || "/avatar.png"}
                alt={user?.username}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                style={{ border: "2px solid transparent", boxShadow: "0 0 0 2px #EC4899" }}
              />
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform hidden sm:block ${showUserMenu ? "rotate-180" : ""}`}
              />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-12 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.profile?.full_name || user?.username}
                    </p>
                    <p className="text-xs text-slate-500">@{user?.username}</p>
                  </div>

                  <Link
                    to={`/profile/${user?._id}`}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    <User size={15} />
                    View Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    <Settings size={15} />
                    Settings
                  </Link>

                  <div className="border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar (expandable) */}
      <AnimatePresence>
        {mobileSearch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-[rgba(10,0,16,0.98)] backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-xl z-50"
          >
            <div ref={searchRef} className="relative p-3 pt-0">
              <Search
                size={16}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                autoFocus
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => { handleSearch(e.target.value); setShowSearch(true); }}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:text-white"
              />
              <AnimatePresence>
                {showSearch && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-3 right-3 top-14 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                  >
                    {searchResults.map((u) => (
                      <Link
                        key={u._id}
                        to={`/profile/${u._id}`}
                        onClick={() => { setMobileSearch(false); setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                      >
                        <img src={u.profile?.profile_picture || "/avatar.png"} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="text-sm font-semibold dark:text-white">{u.username}</p>
                          <p className="text-xs text-slate-500">{u.profile?.full_name}</p>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Topbar;
