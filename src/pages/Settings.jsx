import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleDarkMode } from "../redux/slices/uiSlice";
import { setUser, logout } from "../redux/slices/authSlice";
import apiClient from "../services/apiClient";
import { useLogout, useDeactivateUser } from "../hooks/useApi";
import MainLayout from "../components/layouts/MainLayout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  MessageSquare, Trash2, AlertTriangle,
} from "lucide-react";
import Avatar from "../components/Avatar";
import ChangePassword from "../components/ChangePassword";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

/* ── Reusable setting row ── */
const SettingRow = ({ icon: Icon, label, description, children, danger }) => (
  <div className={`flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-3 sm:gap-4 ${danger ? "text-red-500" : ""}`}>
    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
      <div className={`w-9 h-9 mt-0.5 sm:mt-0 rounded-xl flex items-center justify-center flex-shrink-0 ${
        danger ? "bg-red-50 dark:bg-red-900/20" : "bg-slate-100 dark:bg-slate-800"
      }`}>
        <Icon size={18} className={danger ? "text-red-500" : "text-slate-500 dark:text-slate-400"} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${danger ? "text-red-500" : "text-slate-900 dark:text-white"}`}>{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

/* ── Toggle switch ── */
const Toggle = ({ checked, onChange }) => (
  <button onClick={onChange}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "" : "bg-slate-200 dark:bg-slate-700"}`}
    style={checked ? { background: "linear-gradient(135deg,#7C3AED,#EC4899)" } : {}}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

/* ── Section card ── */
const Section = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 mb-4 shadow-sm">
    <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-4 pb-2">{title}</h2>
    {children}
  </div>
);

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { isDarkMode } = useSelector((s) => s.ui);

  const [privacy, setPrivacy] = useState({
    is_private:               user?.is_private               ?? false,
    allow_follow:             user?.allow_follow             ?? true,
    message_privacy:          user?.message_privacy          ?? "everyone",
    who_can_see_followers:    user?.who_can_see_followers    ?? "everyone",
    who_can_see_following:    user?.who_can_see_following    ?? "everyone",
  });
  const [savingPrivacy,  setSavingPrivacy]  = useState(false);
  const [savedPrivacy,   setSavedPrivacy]   = useState(false);
  const [privacyError,   setPrivacyError]   = useState("");
  
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    posts: true,
    messages: true,
  });
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savedNotifications, setSavedNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  
  const [blockedUsers,   setBlockedUsers]   = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [showBlocked,    setShowBlocked]    = useState(false);
  const [activeSection,  setActiveSection]  = useState("appearance");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Mutations
  const { mutate: handleLogout, isPending: isLoggingOut } = useLogout();
  const { mutate: handleDeactivate, isPending: isDeactivating } = useDeactivateUser();
  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      setLoadingNotifications(true);
      try {
        const res = await apiClient.get("/users/notification-preferences");
        const prefs = res.data?.data?.notification_preferences;
        if (prefs) {
          setNotifications(prefs);
        }
      } catch (e) {
        console.error("Failed to fetch notification preferences:", e);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotificationPreferences();
  }, []);

  const sections = [
    { key: "appearance",    label: "Appearance",    icon: Sun },
    { key: "privacy",       label: "Privacy",       icon: Shield },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "blocked",       label: "Blocked Users", icon: UserX },
    { key: "account",       label: "Account",       icon: Lock },
  ];

  const savePrivacy = async () => {
    setSavingPrivacy(true);
    setPrivacyError("");
    try {
      const res = await apiClient.post("/users/update-privacy-settings", {
        is_private:               privacy.is_private,
        allow_follow:             privacy.allow_follow,
        message_privacy:          privacy.message_privacy,
        who_can_see_followers:    privacy.who_can_see_followers,
        who_can_see_following:    privacy.who_can_see_following,
      });
      // Update Redux so other parts of the app see the new settings immediately
      const updatedSettings = res.data?.data || {};
      dispatch(setUser({
        ...user,
        is_private:      updatedSettings.is_private      ?? privacy.is_private,
        allow_follow:    updatedSettings.allow_follow    ?? privacy.allow_follow,
        message_privacy: updatedSettings.message_privacy ?? privacy.message_privacy,
        who_can_see_followers: updatedSettings.who_can_see_followers ?? privacy.who_can_see_followers,
        who_can_see_following: updatedSettings.who_can_see_following ?? privacy.who_can_see_following,
      }));
      setSavedPrivacy(true);
      setTimeout(() => setSavedPrivacy(false), 2500);
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to save settings. Please try again.";
      setPrivacyError(msg);
    } finally {
      setSavingPrivacy(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotifications(true);
    setNotificationsError("");
    try {
      const res = await apiClient.put("/users/notification-preferences", notifications);
      setSavedNotifications(true);
      setTimeout(() => setSavedNotifications(false), 2500);
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to save notification preferences. Please try again.";
      setNotificationsError(msg);
    } finally {
      setSavingNotifications(false);
    }
  };

  const toggleNotification = (type) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const loadBlockedUsers = async () => {
    if (blockedUsers.length > 0) { setShowBlocked(true); return; }
    setLoadingBlocked(true);
    try {
      // Backend route: GET /api/v1/blocks/
      const res = await apiClient.get("/blocks");
      const data = res.data?.data;
      setBlockedUsers(
        data?.blockedUsers || data?.users || res.data?.blockedUsers || []
      );
    } catch (e) {
      console.error("Load blocked users error:", e);
    } finally {
      setLoadingBlocked(false);
      setShowBlocked(true);
    }
  };

  const unblock = async (userId) => {
    try {
      // Backend route: POST /api/v1/blocks/toggle/:blockUserId (toggles block off)
      await apiClient.post(`/blocks/toggle/${userId}`);
      setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (e) { console.error("Unblock error:", e); }
  };

  const onLogout = () => {
    handleLogout(undefined, {
      onSuccess: () => {
        dispatch(logout());
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      },
      onError: (err) => {
        console.error("Logout error:", err);
        // Force logout anyway
        dispatch(logout());
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      },
    });
  };

  const onDeactivate = () => {
    handleDeactivate(undefined, {
      onSuccess: () => {
        dispatch(logout());
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      },
      onError: (err) => {
        console.error("Deactivate error:", err);
      },
    });
    setShowDeactivateConfirm(false);
  };

  return (
    <MainLayout
      sidebar={<Sidebar />}
      topbar={<Topbar />}
    >
      <div className="max-w-2xl mx-auto p-3 sm:p-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-5">Settings</h1>

        {/* ── Sidebar Nav (horizontal on mobile, vertical on large) ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          {sections.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setActiveSection(key); setIsChangingPassword(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                activeSection === key
                  ? "text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              style={activeSection === key ? { background: "linear-gradient(135deg,#7C3AED,#EC4899)" } : {}}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── APPEARANCE ── */}
          {activeSection === "appearance" && (
            <motion.div key="appearance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Section title="Appearance">
                <SettingRow icon={isDarkMode ? Moon : Sun} label="Dark Mode"
                  description={isDarkMode ? "Currently using dark theme" : "Currently using light theme"}>
                  <Toggle checked={isDarkMode} onChange={() => dispatch(toggleDarkMode())} />
                </SettingRow>
              </Section>
            </motion.div>
          )}

          {/* ── PRIVACY ── */}
          {activeSection === "privacy" && (
            <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Section title="Privacy">
                {/* Private Account */}
                <SettingRow icon={Lock} label="Private Account"
                  description={privacy.is_private
                    ? "Only approved followers can see your posts"
                    : "Anyone can see your posts and follow you"}>
                  <Toggle checked={privacy.is_private}
                    onChange={() => setPrivacy((p) => ({ ...p, is_private: !p.is_private }))} />
                </SettingRow>

                {/* Allow Follow */}
                <SettingRow icon={Users} label="Allow Follow Requests"
                  description={privacy.allow_follow
                    ? "Other users can send you follow requests"
                    : "No one can follow you (existing followers unaffected)"}>
                  <Toggle checked={privacy.allow_follow}
                    onChange={() => setPrivacy((p) => ({ ...p, allow_follow: !p.allow_follow }))} />
                </SettingRow>

                {/* Message Privacy */}
                <SettingRow icon={MessageSquare} label="Who Can Message You"
                  description="Control who can send you direct messages">
                  <select value={privacy.message_privacy}
                    onChange={(e) => setPrivacy((p) => ({ ...p, message_privacy: e.target.value }))}
                    className="text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-0 rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer max-w-[110px] sm:max-w-none">
                    <option value="everyone">Everyone</option>
                    <option value="followers">Followers</option>
                    <option value="no_one">No One</option>
                  </select>
                </SettingRow>
                
                {/* Who can see Followers */}
                <SettingRow icon={Users} label="Who Can See Your Followers"
                  description="Control who can view the list of users that follow you">
                  <select value={privacy.who_can_see_followers}
                    onChange={(e) => setPrivacy((p) => ({ ...p, who_can_see_followers: e.target.value }))}
                    className="text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-0 rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer max-w-[140px] sm:max-w-none">
                    <option value="everyone">Everyone</option>
                    <option value="followers">Followers</option>
                    <option value="no_one">No One</option>
                  </select>
                </SettingRow>

                {/* Who can see Following */}
                <SettingRow icon={Users} label="Who Can See Your Following"
                  description="Control who can view the list of users you follow">
                  <select value={privacy.who_can_see_following}
                    onChange={(e) => setPrivacy((p) => ({ ...p, who_can_see_following: e.target.value }))}
                    className="text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-0 rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer max-w-[140px] sm:max-w-none">
                    <option value="everyone">Everyone</option>
                    <option value="followers">Followers</option>
                    <option value="no_one">No One</option>
                  </select>
                </SettingRow>
              </Section>

              {/* Info banner */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3 mb-4 text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                <strong>Private Account:</strong> When enabled, only approved followers see your posts.
                New follow requests will need your approval.
              </div>

              {privacyError && (
                <p className="text-xs text-red-500 text-center mb-3 flex items-center justify-center gap-1">
                  ⚠ {privacyError}
                </p>
              )}

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={savePrivacy} disabled={savingPrivacy}
                className="w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl font-medium transition disabled:opacity-70"
                style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)", boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}>
                {savingPrivacy
                  ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                  : savedPrivacy
                  ? <><CheckCircle2 size={16} /> Saved!</>
                  : "Save Privacy Settings"}
              </motion.button>
            </motion.div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeSection === "notifications" && (
            <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Section title="Notifications">
                {loadingNotifications ? (
                  <div className="py-8 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-purple-500" />
                  </div>
                ) : (
                  <>
                    <SettingRow icon={Bell} label="Likes" description="When someone likes your post">
                      <Toggle checked={notifications.likes} onChange={() => toggleNotification("likes")} />
                    </SettingRow>
                    <SettingRow icon={MessageSquare} label="Comments" description="When someone comments on your post">
                      <Toggle checked={notifications.comments} onChange={() => toggleNotification("comments")} />
                    </SettingRow>
                    <SettingRow icon={Users} label="Follows" description="When someone follows you">
                      <Toggle checked={notifications.follows} onChange={() => toggleNotification("follows")} />
                    </SettingRow>
                    <SettingRow icon={Globe} label="Mentions" description="When someone mentions you">
                      <Toggle checked={notifications.mentions} onChange={() => toggleNotification("mentions")} />
                    </SettingRow>
                    <SettingRow icon={Bell} label="Posts" description="When your followers create new posts">
                      <Toggle checked={notifications.posts} onChange={() => toggleNotification("posts")} />
                    </SettingRow>
                    <SettingRow icon={MessageSquare} label="Messages" description="When someone sends you a message">
                      <Toggle checked={notifications.messages} onChange={() => toggleNotification("messages")} />
                    </SettingRow>
                  </>
                )}
              </Section>

              {notificationsError && (
                <p className="text-xs text-red-500 text-center mb-3 flex items-center justify-center gap-1">
                  ⚠ {notificationsError}
                </p>
              )}

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={saveNotifications} disabled={savingNotifications || loadingNotifications}
                className="w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl font-medium transition disabled:opacity-70"
                style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)", boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}>
                {savingNotifications
                  ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                  : savedNotifications
                  ? <><CheckCircle2 size={16} /> Saved!</>
                  : "Save Notification Settings"}
              </motion.button>
            </motion.div>
          )}

          {/* ── BLOCKED USERS ── */}
          {activeSection === "blocked" && (
            <motion.div key="blocked" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Section title="Blocked Users">
                {!showBlocked ? (
                  <div className="py-4">
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={loadBlockedUsers} disabled={loadingBlocked}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300">
                      {loadingBlocked ? <><Loader2 size={15} className="animate-spin" /> Loading…</> : <><UserX size={15} /> View Blocked Users</>}
                    </motion.button>
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <div className="py-8 text-center">
                    <UserX className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No blocked users</p>
                  </div>
                ) : (
                  blockedUsers.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <Avatar
                        profilePicture={u.profile?.profile_picture}
                        fullName={u.profile?.full_name}
                        username={u.username}
                        size="sm"
                        className="w-10 h-10"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.profile?.full_name || u.username}</p>
                        <p className="text-xs text-slate-500">@{u.username}</p>
                      </div>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => unblock(u._id)}
                        className="text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        Unblock
                      </motion.button>
                    </div>
                  ))
                )}
              </Section>
            </motion.div>
          )}

          {/* ── ACCOUNT ── */}
          {activeSection === "account" && !isChangingPassword && (
            <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Section title="Account">
                <SettingRow icon={Lock} label="Change Password" description="Update your account password">
                  <button onClick={() => setIsChangingPassword(true)}
                    className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 font-medium hover:underline">
                    Change <ChevronRight size={14} />
                  </button>
                </SettingRow>
                <SettingRow icon={EyeOff} label="Deactivate Account" description="Temporarily disable your account" danger>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDeactivateConfirm(true)}
                    disabled={isDeactivating}
                    className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-60">
                    {isDeactivating ? "Deactivating..." : "Deactivate"}
                  </motion.button>
                </SettingRow>
                <SettingRow icon={Trash2} label="Delete Account" description="Permanently delete your account and all data" danger>
                  <motion.button whileTap={{ scale: 0.95 }}
                    className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition">
                    Delete
                  </motion.button>
                </SettingRow>
                <SettingRow icon={Lock} label="Logout" description="Sign out from your account">
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-60">
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </motion.button>
                </SettingRow>
              </Section>
              <p className="text-xs text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                <AlertTriangle size={11} /> Account deletion is irreversible and cannot be undone.
              </p>
            </motion.div>
          )}

          {/* ── CHANGE PASSWORD SUB-VIEW ── */}
          {activeSection === "account" && isChangingPassword && (
            <ChangePassword onBack={() => setIsChangingPassword(false)} />
          )}
        </AnimatePresence>

        {/* ── DEACTIVATE CONFIRMATION MODAL ── */}
        <AlertDialog open={showDeactivateConfirm} onOpenChange={setShowDeactivateConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Your Account?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to deactivate your account? Your profile, posts, and messages will be hidden. You can reactivate your account anytime by logging in with your credentials.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDeactivate}
                disabled={isDeactivating}
                className="bg-red-600 hover:bg-red-700 text-white">
                {isDeactivating ? "Deactivating..." : "Deactivate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default Settings;
