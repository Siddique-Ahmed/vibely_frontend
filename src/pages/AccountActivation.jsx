import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import apiClientVercel from "../services/apiClientVercel";
import apiClient from "../services/apiClient";
import {
  Mail, Phone, User as UserIcon, RefreshCw, CheckCircle2, AlertCircle,
  Loader2, ArrowLeft, ShieldCheck,
} from "lucide-react";

const AccountActivation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // Step 1: Get identifier (username, email, or phone)
  // Step 2: Verify OTP
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [identifierType, setIdentifierType] = useState("email"); // email, username, phone
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // If user is already active, redirect to feed
  useEffect(() => {
    if (user?.is_active) {
      navigate("/feed", { replace: true });
    }
  }, [user, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (step === 2 && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 2) {
      setCanResend(true);
    }
  }, [resendTimer, step]);

  const validateIdentifier = () => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError("Please enter your email, username, or phone number");
      return false;
    }

    // Simple validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10,}$/;

    if (emailRegex.test(trimmed)) {
      setIdentifierType("email");
    } else if (phoneRegex.test(trimmed)) {
      setIdentifierType("phone");
    } else {
      setIdentifierType("username");
    }

    return true;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!validateIdentifier()) return;

    setLoading(true);
    setError("");

    try {
      const response = await apiClientVercel.post("/users/activate-user");

      if (response.data?.success) {
        setSuccess(`OTP sent to your ${identifierType}`);
        setStep(2);
        setOtp(["", "", "", "", "", ""]);
        setResendTimer(60);
        setCanResend(false);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to send OTP. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
      handleVerifyOtp(newOtp.join(""));
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
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (otpValue) => {
    const code = otpValue || otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClientVercel.post(
        "/users/verify-user-activation",
        {
          otp: code,
        }
      );

      if (response.data?.success) {
        setSuccess("Account activated successfully!");
        // Fetch updated user profile
        const profileRes = await apiClient.get("/users/my-profile");
        const userData = profileRes.data?.data;
        if (userData) {
          dispatch(setUser(userData));
          localStorage.setItem("user", JSON.stringify(userData));
        }
        setTimeout(() => {
          navigate("/feed", { replace: true });
        }, 1500);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Verification failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError("");

    try {
      const response = await apiClientVercel.post("/users/activate-user");

      if (response.data?.success) {
        setSuccess(`OTP resent to your ${identifierType}`);
        setResendTimer(60);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to resend OTP. Please try again.";
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setSuccess("");
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block p-3 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full mb-4"
            >
              <ShieldCheck className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Activate Your Account
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Verify your identity to activate your account
            </p>
          </motion.div>

          {/* Step 1: Enter Identifier */}
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleRequestOtp}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Email, Username, or Phone Number
                </label>
                <motion.input
                  type="text"
                  placeholder="Enter your email, username, or phone"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError("");
                  }}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-violet-500 dark:focus:border-violet-400 focus:outline-none transition-colors"
                  whileFocus={{ scale: 1.02 }}
                />
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send OTP
                  </>
                )}
              </motion.button>

              {/* Back Button */}
              <motion.button
                type="button"
                onClick={handleBack}
                className="w-full py-2 px-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </motion.button>
            </motion.form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <p className="text-center text-slate-600 dark:text-slate-400 text-sm">
                We've sent a verification code to your{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {identifierType}
                </span>
              </p>

              {/* OTP Input Fields */}
              <div className="flex gap-2 justify-center">
                {otp.map((digit, idx) => (
                  <motion.input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    className="w-12 h-12 text-center text-2xl font-bold rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-violet-500 dark:focus:border-violet-400 focus:outline-none transition-colors"
                    whileFocus={{ scale: 1.1 }}
                  />
                ))}
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {success}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Resend Option */}
              <div className="text-center">
                {canResend ? (
                  <motion.button
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold text-sm flex items-center justify-center gap-1 mx-auto"
                    whileHover={{ scale: 1.05 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    {resending ? "Resending..." : "Resend OTP"}
                  </motion.button>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Resend OTP in {resendTimer}s
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                onClick={() => handleVerifyOtp(otp.join(""))}
                disabled={loading || otp.some((d) => !d)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Verify & Activate
                  </>
                )}
              </motion.button>

              {/* Back Button */}
              <motion.button
                type="button"
                onClick={handleBack}
                className="w-full py-2 px-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-white/70 text-sm mt-6"
        >
          Need help?{" "}
          <a href="mailto:support@vibely.com" className="text-white font-semibold hover:underline">
            Contact support
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AccountActivation;
