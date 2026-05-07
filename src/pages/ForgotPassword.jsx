import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import apiClientVercel from "../services/apiClientVercel";
import apiClient from "../services/apiClient";
import {
  Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight,
  RefreshCw, CheckCircle2, AlertCircle, Loader2, KeyRound,
} from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: identifier, 2: OTP, 3: new password
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState(""); // returned from backend
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Timer for OTP resend
  useEffect(() => {
    if (step === 2 && resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
    if (step === 2 && resendTimer === 0) setCanResend(true);
  }, [step, resendTimer]);

  // Step 1: Request OTP
  const handleRequestOtp = async () => {
    if (!identifier.trim()) {
      setError("Please enter your email, username, or phone");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiClientVercel.post("/users/forgot-password", {
        email: identifier,
        username: identifier,
        phone_number: identifier,
      });
      // Backend returns the actual email it sent OTP to
      const returnedEmail = res.data?.data?.email || identifier;
      setEmail(returnedEmail);
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.message || "User not found. Check your details.");
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (idx, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    setError("");
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (val && idx === 5 && newOtp.every((d) => d !== "")) handleVerifyOtp(newOtp.join(""));
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
      handleVerifyOtp(pasted);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (otpValue) => {
    const code = otpValue || otp.join("");
    if (code.length !== 6) { setError("Enter the complete 6-digit OTP"); return; }
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/users/verify-forgot-password", { email, otp: code });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    setError("");
    try {
      await apiClientVercel.post("/users/forgot-password", {
        email, username: email, phone_number: email,
      });
      setSuccess("New OTP sent!");
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

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiClientVercel.post("/users/reset-password", { email, new_password: newPassword });
      setSuccess("Password reset successfully!");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    { title: "Forgot Password", sub: "Enter your account details to receive an OTP" },
    { title: "Enter OTP", sub: `We sent a 6-digit code to ${email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "***" + c)}` },
    { title: "New Password", sub: "Create a strong new password for your account" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f0117 0%, #1a0533 40%, #0d1117 100%)" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #7C3AED, transparent)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #F97316, transparent)" }} />
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
          <div className="text-center mb-7">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(249,115,22,0.2))", border: "1px solid rgba(124,58,237,0.4)" }}
            >
              <KeyRound size={28} className="text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{stepTitles[step - 1].title}</h1>
            <p className="text-slate-400 text-sm leading-relaxed">{stepTitles[step - 1].sub}</p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: s === step ? 24 : 8,
                  background: s <= step
                    ? "linear-gradient(90deg, #7C3AED, #EC4899)"
                    : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>

          {/* Alerts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="err" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                <AlertCircle size={14} className="flex-shrink-0" /> {error}
              </motion.div>
            )}
            {success && (
              <motion.div key="suc" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }}>
                <CheckCircle2 size={14} className="flex-shrink-0" /> {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Step 1: Identifier ── */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email / Username / Phone
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleRequestOtp()}
                    placeholder="Find your account..."
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.3)" }}
                  />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleRequestOtp} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Searching...</> : <>Send OTP <ArrowRight size={16} /></>}
              </motion.button>
            </motion.div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-bold text-white rounded-xl focus:outline-none transition-all"
                    style={{
                      height: 52,
                      background: digit ? "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2))" : "rgba(255,255,255,0.06)",
                      border: digit ? "2px solid rgba(236,72,153,0.6)" : "2px solid rgba(124,58,237,0.25)",
                    }}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleVerifyOtp()} disabled={loading || otp.join("").length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <>Verify OTP <ArrowRight size={16} /></>}
              </motion.button>

              <div className="text-center">
                {canResend ? (
                  <button onClick={handleResend} disabled={resending}
                    className="text-sm font-semibold flex items-center justify-center gap-1.5 mx-auto"
                    style={{ background: "linear-gradient(90deg, #7C3AED, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    <RefreshCw size={13} className="text-purple-400" />
                    {resending ? "Resending..." : "Resend OTP"}
                  </button>
                ) : (
                  <p className="text-sm text-slate-500">
                    Resend in <span className="font-bold text-purple-400">{resendTimer}s</span>
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400" />
                  <input type={showPass ? "text" : "password"} value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    placeholder="Min. 6 characters" autoFocus
                    className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(249,115,22,0.3)" }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400" />
                  <input type={showConfirm ? "text" : "password"} value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${confirmPassword && newPassword !== confirmPassword ? "rgba(239,68,68,0.5)" : "rgba(249,115,22,0.3)"}`,
                    }}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleResetPassword} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl font-semibold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)", boxShadow: "0 4px 24px rgba(124,58,237,0.4)" }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : <><CheckCircle2 size={16} /> Reset Password</>}
              </motion.button>
            </motion.div>
          )}

          {/* Back to Login */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition">
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
