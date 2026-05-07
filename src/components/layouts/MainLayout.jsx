import React from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { Home, Search, Bell, User } from "lucide-react";

const MainLayout = ({ children, sidebar, topbar, hideBottomNav = false }) => {
  const { user } = useSelector((state) => state.auth);
  const { isDarkMode, unreadCount } = useSelector((state) => state.ui);

  const mobileNavItems = [
    { name: "Home",          path: "/feed",                 icon: Home },
    { name: "Explore",       path: "/explore",              icon: Search },
    { name: "Notifs",        path: "/notifications",        icon: Bell, badge: unreadCount },
    { name: "Profile",       path: `/profile/${user?._id}`, icon: User },
  ];

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: isDarkMode ? "#0a0010" : "#f8f4ff",
      }}
    >
      {/* ── Desktop Sidebar ── */}
      <motion.div
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex fixed left-0 top-0 h-screen w-64 z-30"
      >
        {sidebar}
      </motion.div>

      {/* ── Main Content ── */}
      <div className={`flex-1 min-w-0 md:ml-64 ${hideBottomNav ? "pb-0" : "pb-16 md:pb-0"}`}>
        {/* Topbar */}
        <div
          className="sticky top-0 z-40"
          style={{
            borderBottom: isDarkMode
              ? "1px solid rgba(124,58,237,0.2)"
              : "1px solid rgba(124,58,237,0.12)",
            background: isDarkMode
              ? "rgba(10,0,16,0.92)"
              : "rgba(248,244,255,0.92)",
            backdropFilter: "blur(16px)",
          }}
        >
          {topbar}
        </div>

        {/* Page Content */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-[calc(100vh-60px)]"
        >
          {children}
        </motion.main>
      </div>

      {/* ── Mobile Bottom Nav (Facebook/Instagram style) ── */}
      {!hideBottomNav && (
      <motion.nav
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: isDarkMode
            ? "rgba(10,0,16,0.97)"
            : "rgba(255,255,255,0.97)",
          borderTop: isDarkMode
            ? "1px solid rgba(124,58,237,0.25)"
            : "1px solid rgba(124,58,237,0.15)",
          backdropFilter: "blur(16px)",
          boxShadow: isDarkMode
            ? "0 -4px 30px rgba(124,58,237,0.1)"
            : "0 -4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex items-center justify-around px-2 py-1.5">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[60px]"
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    whileTap={{ scale: 0.82 }}
                    className="relative p-2 rounded-xl transition-all"
                    style={
                      isActive
                        ? {
                            background:
                              "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.15))",
                          }
                        : {}
                    }
                  >
                    <item.icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 1.7}
                      style={
                        isActive
                          ? {
                              color: "#EC4899",
                              filter: "drop-shadow(0 0 6px rgba(236,72,153,0.6))",
                            }
                          : { color: isDarkMode ? "#64748b" : "#94a3b8" }
                      }
                    />
                    {/* Badge */}
                    {item.badge > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 text-white text-[9px] rounded-full min-w-[15px] h-[15px] flex items-center justify-center font-bold px-0.5"
                        style={{
                          background:
                            "linear-gradient(135deg, #EC4899, #F97316)",
                          fontSize: "9px",
                        }}
                      >
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </motion.div>

                  {/* Label */}
                  <span
                    className="text-[10px] font-medium mt-0.5 transition-all"
                    style={
                      isActive
                        ? {
                            background:
                              "linear-gradient(90deg, #7C3AED, #EC4899)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontWeight: 700,
                          }
                        : { color: isDarkMode ? "#64748b" : "#94a3b8" }
                    }
                  >
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </motion.nav>
      )}
    </div>
  );
};

export default MainLayout;
