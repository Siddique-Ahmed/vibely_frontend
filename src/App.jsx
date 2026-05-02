import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider, useSelector } from "react-redux";
import store from "./redux/store";
import queryClient from "./services/queryClient";
import ProtectedRoute from "./pages/ProtectedRoute";
import { ToastContainer } from "./components/Toast";

// Auth Pages
import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import VerifyEmail    from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import CompleteProfile from "./pages/CompleteProfile";

// App Pages
import Feed          from "./pages/Feed";
import Profile       from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Explore       from "./pages/Explore";
import PostDetail    from "./pages/PostDetail";
import Settings      from "./pages/Settings";
import Bookmarks     from "./pages/Bookmarks";
import Messages      from "./pages/Messages";

import { SocketProvider } from "./context/SocketContext";

const AppWrapper = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <Router>
          <App />
        </Router>
      </SocketProvider>
    </QueryClientProvider>
  </Provider>
);

const App = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { isDarkMode } = useSelector((state) => state.ui);

  // Sync dark mode to <html>
  useEffect(() => {
    const root = document.documentElement;
    isDarkMode ? root.classList.add("dark") : root.classList.remove("dark");
  }, [isDarkMode]);

  return (
    <>
      <Routes>
      {/* ── Public (no auth required) ── */}
      <Route
        path="/login"
        element={isAuthenticated && user ? <Navigate to="/feed" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/feed" replace /> : <Signup />}
      />
      <Route path="/verify-email"    element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ── First-time profile setup (protected, after verify) ── */}
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfile />
          </ProtectedRoute>
        }
      />

      {/* ── Protected App Routes ── */}
      <Route
        path="/feed"
        element={<ProtectedRoute><Feed /></ProtectedRoute>}
      />
      <Route
        path="/profile/:userId"
        element={<ProtectedRoute><Profile /></ProtectedRoute>}
      />
      <Route
        path="/notifications"
        element={<ProtectedRoute><Notifications /></ProtectedRoute>}
      />
      <Route
        path="/explore"
        element={<ProtectedRoute><Explore /></ProtectedRoute>}
      />
      <Route
        path="/post/:postId"
        element={<ProtectedRoute><PostDetail /></ProtectedRoute>}
      />
      <Route
        path="/settings"
        element={<ProtectedRoute><Settings /></ProtectedRoute>}
      />
      <Route
        path="/bookmarks"
        element={<ProtectedRoute><Bookmarks /></ProtectedRoute>}
      />
      <Route
        path="/messages"
        element={<ProtectedRoute><Messages /></ProtectedRoute>}
      />

      {/* ── Root ── */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/feed" : "/login"} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toast Container for notifications */}
      <ToastContainer />
    </>
  );
};

export default AppWrapper;
