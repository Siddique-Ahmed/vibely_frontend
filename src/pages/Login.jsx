import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser, setToken, setError } from "../redux/slices/authSlice";
import apiClient from "../services/apiClient";
import {
  Mail, Lock, Eye, EyeOff, LogIn,
  Loader2, AlertCircle,
} from "lucide-react";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorState("Please fill in all fields");
      return;
    }
    setLoading(true);
    setErrorState("");

    try {
      // Step 1: Login - get accessToken
      console.log("[Login] Attempting login with identifier:", identifier);
      const response = await apiClient.post("/users/login", {
        email: identifier,
        username: identifier,
        phone_number: identifier,
        password,
      });

      const { data } = response.data;
      const accessToken = data?.accessToken;

      if (!accessToken) {
        setErrorState("Login failed. No token received.");
        return;
      }

      console.log("[Login] Token received successfully");

      // Save token first so next request is authenticated
      dispatch(setToken(accessToken));
      localStorage.setItem("token", accessToken);

      // Step 2: Fetch user profile
      console.log("[Login] Fetching user profile...");
      const profileRes = await apiClient.get("/users/my-profile");

      const userData = profileRes.data?.data;
      if (userData) {
        console.log("[Login] User profile received:", userData._id);
        dispatch(setUser(userData));
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        throw new Error("No user data received from profile endpoint");
      }

      // Step 3: Navigate to feed
      console.log("[Login] Redirecting to feed...");
      navigate("/feed", { replace: true });

    } catch (err) {
      console.error("[Login] Error:", err);
      const msg = err.response?.data?.message || err.message || "Login failed. Please try again.";
      console.error("[Login] Error message:", msg);
      setErrorState(msg);
      dispatch(setError(msg));
      // Clear token if profile fetch fails
      dispatch(setToken(null));
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0117 0%, #1a0533 40%, #0d1117 100%)",
      }}
    >
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #7C3AED, transparent)" }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #F97316, transparent)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #EC4899, transparent)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: "rgba(15, 1, 30, 0.88)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(124, 58, 237, 0.3)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              src="/vibely_logo.png"
              alt="Vibely"
              className="mx-auto mb-4 drop-shadow-2xl"
              style={{ width: 72, height: 72 }}
            />
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-3xl font-black mb-1"
              style={{
                background: "linear-gradient(90deg, #7C3AED, #EC4899, #F97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Vibely
            </motion.h1>
            <p className="text-slate-400 text-sm">Welcome back! Sign in to continue</p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm"
                style={{
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                }}
              >
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Identifier */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email / Username / Phone
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setErrorState(""); }}
                  placeholder="Enter email, username or phone"
                  autoFocus
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(124,58,237,0.3)",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium hover:opacity-80 transition"
                  style={{
                    background: "linear-gradient(90deg, #7C3AED, #EC4899)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorState(""); }}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(236,72,153,0.3)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)",
                boxShadow: "0 4px 24px rgba(124,58,237,0.45)",
              }}
            >
              {loading ? (
                <><Loader2 size={17} className="animate-spin" /> Signing in...</>
              ) : (
                <><LogIn size={17} /> Sign In</>
              )}
            </motion.button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          <p className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold hover:opacity-80 transition"
              style={{
                background: "linear-gradient(90deg, #7C3AED, #EC4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Create one free →
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          By continuing, you agree to Vibely's{" "}
          <span className="text-purple-500">Terms</span> &{" "}
          <span className="text-purple-500">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
