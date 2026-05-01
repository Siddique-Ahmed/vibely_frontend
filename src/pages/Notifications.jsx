import React, { useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, useClearAllNotifications } from "../hooks/useApi";
import { formatTimeAgo } from "../utils/formatters";
import { Link } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  Heart,
  MessageCircle,
  UserPlus,
  CornerUpLeft,
  AtSign,
  Mail,
  FileText,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Loader2,
  Trash2,
  Trash,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

const notifIconMap = {
  like: { icon: Heart, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
  comment: { icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  follow: { icon: UserPlus, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
  reply: { icon: CornerUpLeft, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  mention: { icon: AtSign, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
  message: { icon: Mail, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  post: { icon: FileText, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800" },
};

const Notifications = () => {
  const [status, setStatus] = useState("unread");
  const { data: notificationsData, isLoading, refetch } = useNotifications(1, 20, status);
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutate: clearAllNotifications } = useClearAllNotifications();

  const notifications = notificationsData?.data?.notifications || [];

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleMArkAllAsRead = () => {
    markAllAsRead();
  };

  const handleDeleteNotification = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const tabs = [
    { key: "unread", label: "Unread" },
    { key: "read", label: "Read" },
    { key: "all", label: "All" },
  ];

  return (
    <MainLayout
      sidebar={<Sidebar />}
      topbar={<Topbar />}
    >
      <div className="max-w-2xl mx-auto px-3 py-4 sm:px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            {status === "unread" && notifications.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleMArkAllAsRead}
                className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-1.5 rounded-lg transition"
              >
                <CheckCheck size={13} />
                Mark all read
              </motion.button>
            )}
            {status === "all" && notifications.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition"
                  >
                    <Trash size={13} />
                    Clear all
                  </motion.button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-slate-900 dark:text-white">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                      This action cannot be undone. This will permanently delete all your notifications from the server.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border-none">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => clearAllNotifications()} 
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {tabs.map((tab) => (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.97 }}
                onClick={() => setStatus(tab.key)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  status === tab.key
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#EC4899" }} />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notif, idx) => {
              const iconConfig = notifIconMap[notif.type] || {
                icon: Bell,
                color: "text-slate-500",
                bg: "bg-slate-50 dark:bg-slate-800",
              };
              const IconComponent = iconConfig.icon;

              return (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => notif.status === "unread" && handleMarkAsRead(notif._id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all group ${
                    notif.status === "unread"
                      ? "bg-purple-50/60 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Sender Avatar + Type Icon */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={notif.sender?.profile?.profile_picture || "/avatar.png"}
                        alt={notif.sender?.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800"
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 ${iconConfig.bg}`}
                      >
                        <IconComponent size={11} className={iconConfig.color} strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug">
                            <Link
                              to={`/profile/${notif.sender?._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition"
                            >
                              {notif.sender?.username}
                            </Link>{" "}
                            <span className="text-slate-600 dark:text-slate-400">
                              {notif.message || (
                                notif.type === "follow" ? "started following you" : 
                                notif.type === "comment" ? "commented on your post" :
                                `${notif.type}d your post`
                              )}
                            </span>
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {formatTimeAgo(notif.createdAt)} ago
                          </p>

                          {notif.post && (
                            <Link
                              to={`/post/${notif.post._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 mt-2 text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-700 dark:text-slate-300 transition font-medium"
                            >
                              View Post →
                            </Link>
                          )}
                        </div>

                        {/* Unread indicator */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {status === "all" && (
                            <button
                              onClick={(e) => handleDeleteNotification(e, notif._id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              title="Delete notification"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          {notif.status === "unread" && (
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #EC4899, #F97316)" }} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              {status === "unread" ? (
                <BellOff className="w-9 h-9 text-slate-400" />
              ) : (
                <Bell className="w-9 h-9 text-slate-400" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {status === "unread" ? "You're all caught up!" : "No notifications yet"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
              {status === "unread"
                ? "No unread notifications right now. Check back later!"
                : "When someone likes, comments, or follows you, you'll see it here."}
            </p>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
};

export default Notifications;
