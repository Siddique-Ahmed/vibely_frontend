import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setToken, setUser } from "../redux/slices/authSlice";
import apiClient from "../services/apiClient";
import {
  Mail, RefreshCw, CheckCircle2, AlertCircle,
  Loader2, ArrowLeft, ShieldCheck,
} from "lucide-react";

const VerifyEmail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Get email from sessionStorage
  const email = sessionStorage.getItem("pendingVerifyEmail") || "";

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // If no email in session, redirect to signup
  useEffect(() => {
    if (!email) {
      navigate("/signup", { replace: true });
    }
  }, []);

  const handleOtpChange = (idx, val) => {
    if (!/^[0-9]?$/.test(val)) return; // Only digits
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    setError("");

    // Move to next box
    if (val && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (val && idx === 5 && newOtp.every((d) => d !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (otpValue) => {
    const code = otpValue || otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/users/verify-signup", {
        email,
        otp: code,
      });

      const { data } = response.data;
      const accessToken = data?.accessToken;

      if (accessToken) {
        dispatch(setToken(accessToken));
        localStorage.setItem("token", accessToken);

        // Fetch user profile
        try {
          const profileRes = await apiClient.get("/users/my-profile", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const userData = profileRes.data?.data;
          if (userData) {
            dispatch(setUser(userData));
            localStorage.setItem("user", JSON.stringify(userData));
          }
        } catch {}

        // Clear session
        sessionStorage.removeItem("pendingVerifyEmail");

        setSuccess("Email verified! Redirecting...");
        setTimeout(() => navigate("/complete-profile", { replace: true }), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
      // Clear OTP inputs on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.post("/users/resend-otp", { email });
      setSuccess("New OTP sent to your email!");
      setResendTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.min(b.length, 5)) + c)
    : "";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f0117 0%, #1a0533 40%, #0d1117 100%)" }}
    >
      {/* BG blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #7C3AED, transparent)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #F97316, transparent)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #EC4899, transparent)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2))",
                border: "1px solid rgba(124,58,237,0.4)",
              }}
            >
              <ShieldCheck size={36} className="text-purple-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Verify your email</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              We sent a 6-digit code to{" "}
              <span className="text-purple-300 font-medium">{maskedEmail}</span>
              <br />
              Enter it below to continue.
            </p>
          </div>

          {/* Alerts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
              >
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div key="success"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }}
              >
                <CheckCircle2 size={15} className="flex-shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* OTP Input Grid */}
          <div className="mb-7">
            <label className="block text-sm font-medium text-slate-300 mb-4 text-center">
              Enter 6-digit OTP
            </label>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <motion.input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="w-12 h-14 text-center text-xl font-bold text-white rounded-xl focus:outline-none transition-all"
                  style={{
                    background: digit
                      ? "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2))"
                      : "rgba(255,255,255,0.06)",
                    border: digit
                      ? "2px solid rgba(236,72,153,0.6)"
                      : "2px solid rgba(124,58,237,0.25)",
                    boxShadow: digit
                      ? "0 0 16px rgba(236,72,153,0.2)"
                      : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVerify()}
            disabled={loading || otp.join("").length !== 6}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition mb-4 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)",
              boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
            }}
          >
            {loading ? (
              <><Loader2 size={17} className="animate-spin" /> Verifying...</>
            ) : (
              <><ShieldCheck size={17} /> Verify Email</>
            )}
          </motion.button>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-2">Didn't receive the code?</p>
            {canResend ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResend}
                disabled={resending}
                className="flex items-center justify-center gap-2 mx-auto text-sm font-semibold transition"
                style={{
                  background: "linear-gradient(90deg, #7C3AED, #EC4899)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {resending ? (
                  <Loader2 size={14} className="animate-spin text-purple-400" />
                ) : (
                  <RefreshCw size={14} className="text-purple-400" />
                )}
                {resending ? "Sending..." : "Resend OTP"}
              </motion.button>
            ) : (
              <p className="text-sm text-slate-500">
                Resend in{" "}
                <span
                  className="font-bold"
                  style={{
                    background: "linear-gradient(90deg, #7C3AED, #EC4899)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {resendTimer}s
                </span>
              </p>
            )}
          </div>

          {/* Back to Signup */}
          <div className="mt-5 pt-5 border-t border-white/5 text-center">
            <Link
              to="/signup"
              className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition"
            >
              <ArrowLeft size={14} /> Use a different email
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
