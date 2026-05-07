import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import apiClientVercel from "../services/apiClientVercel";
import {
  Mail, Phone, Lock, Eye, EyeOff, User, AtSign,
  ArrowRight, ArrowLeft, CheckCircle2, Loader2,
  AlertCircle, ChevronRight,
} from "lucide-react";
import { useDispatch } from "react-redux";

const Signup = () => {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1); // 1:Email 2:Phone 3:Password 4:Profile
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    username: "",
  });

  const handleChange = (e) => {
    setError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) =>
    /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(phone.replace(/\s/g, ""));

  // Step 1 → 2
  const handleStep1 = () => {
    if (!formData.email || !validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setStep(2);
  };

  // Step 2 → 3
  const handleStep2 = () => {
    if (!formData.phone_number || !validatePhone(formData.phone_number)) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setStep(3);
  };

  // Step 3 → 4
  const handleStep3 = () => {
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setStep(4);
  };

  // Step 4: Final Signup
  const handleSignup = async () => {
    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClientVercel.post("/users/signup", {
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        password: formData.password,
        full_name: formData.fullName.trim(),
      });

      // Backend sends OTP to email. Store email for verify page.
      sessionStorage.setItem("pendingVerifyEmail", formData.email.trim());

      // Redirect to OTP verification page
      window.location.href = "/verify-email";

    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Email", "Phone", "Password", "Profile"];

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0117 0%, #1a0533 40%, #0d1117 100%)",
      }}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #7C3AED, transparent)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #F97316, transparent)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #EC4899, transparent)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: "rgba(15, 1, 30, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(124, 58, 237, 0.3)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              src="/vibely_logo.png"
              alt="Vibely"
              className="w-16 h-16 mx-auto mb-3 drop-shadow-2xl"
            />
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-3xl font-bold mb-1"
              style={{
                background: "linear-gradient(90deg, #7C3AED, #EC4899, #F97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Vibely
            </motion.h1>
            {step <= 4 && (
              <p className="text-sm text-slate-400">
                Create your account — Step {step} of 4
              </p>
            )}
          </div>

          {/* Progress Steps */}
          {step <= 4 && (
            <div className="flex items-center mb-8">
              {stepLabels.map((label, idx) => {
                const s = idx + 1;
                const isDone = s < step;
                const isActive = s === step;
                return (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          isDone
                            ? "text-white"
                            : isActive
                            ? "text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-transparent"
                            : "bg-slate-800 text-slate-500"
                        }`}
                        style={
                          isDone || isActive
                            ? {
                                background:
                                  "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)",
                              }
                            : {}
                        }
                      >
                        {isDone ? <CheckCircle2 size={14} /> : s}
                      </div>
                      <span
                        className={`text-[10px] mt-1 font-medium ${
                          isActive ? "text-purple-400" : isDone ? "text-pink-400" : "text-slate-600"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {idx < stepLabels.length - 1 && (
                      <div
                        className="flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all duration-500"
                        style={{
                          background:
                            s < step
                              ? "linear-gradient(90deg, #7C3AED, #EC4899)"
                              : "rgba(100,100,100,0.3)",
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
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

          {/* ── STEP 1: EMAIL ── */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                    placeholder="you@example.com"
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(124,58,237,0.3)",
                    }}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStep1}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                }}
              >
                Continue <ArrowRight size={16} />
              </motion.button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                  Log in
                </Link>
              </p>
            </motion.div>
          )}

          {/* ── STEP 2: PHONE ── */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone number
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400" />
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === "Enter" && handleStep2()}
                    placeholder="+92 300 0000000"
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(236,72,153,0.3)",
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  We'll use this to secure your account
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <ArrowLeft size={15} /> Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStep2}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition"
                  style={{
                    background: "linear-gradient(135deg, #EC4899, #F97316)",
                    boxShadow: "0 4px 20px rgba(236,72,153,0.35)",
                  }}
                >
                  Continue <ArrowRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: PASSWORD ── */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Create Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    autoFocus
                    className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(249,115,22,0.3)",
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400" />
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === "Enter" && handleStep3()}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? "rgba(239,68,68,0.5)"
                          : "rgba(249,115,22,0.3)"
                      }`,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep(2)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <ArrowLeft size={15} /> Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStep3}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #F97316)",
                    boxShadow: "0 4px 20px rgba(249,115,22,0.3)",
                  }}
                >
                  Continue <ArrowRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: PROFILE (Username + Full Name) ── */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Your real name"
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(124,58,237,0.3)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                    placeholder="choose_a_username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(236,72,153,0.3)",
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Letters, numbers, underscores only · Min 3 chars
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep(3)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <ArrowLeft size={15} /> Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignup}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)",
                    boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account <ChevronRight size={16} />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: Verify Email ── */}
          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "linear-gradient(135deg, #7C3AED22, #EC4899 22)" }}
              >
                <Mail size={36} className="text-pink-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Check your email!</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                We sent a verification link to{" "}
                <span className="text-purple-400 font-medium">{formData.email}</span>.
                Please verify to activate your account.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = "/login"}
                className="w-full py-3 rounded-xl font-semibold text-white transition"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                }}
              >
                Go to Login
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
