import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, User, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";

const AccountVerification = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: identifier input, 2: OTP input
  const [identifier, setIdentifier] = useState(sessionStorage.getItem("verifyIdentifier") || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Resend timer countdown
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleRequestOtp = async () => {
    if (!identifier.trim()) {
      setError("Please enter email, username, or phone number");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.post("/users/resend-otp", { email: identifier });
      setSuccess("OTP sent to your registered email");
      setStep(2);
      setTimer(120); // 2 minutes timer
      setCanResend(false);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send OTP. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiClient.post("/users/verify-signup", {
        email: identifier,
        otp,
      });
      
      setSuccess("Account verified successfully! Redirecting to login...");
      setTimeout(() => {
        sessionStorage.removeItem("verifyIdentifier");
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || "OTP verification failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");

    try {
      await apiClient.post("/users/resend-otp", { email: identifier });
      setSuccess("OTP resent to your email");
      setTimer(120);
      setCanResend(false);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex justify-center mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Verify Your Account</h1>
          <p className="text-slate-400">
            {step === 1
              ? "Enter your email, username, or phone to verify your account"
              : "Enter the OTP sent to your registered email"}
          </p>
        </div>

        {/* Step 1: Identifier Input */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="space-y-4">
              {/* Identifier Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email, Username, or Phone
                </label>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="your@email.com or username or +1234567890"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Success */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-400">{success}</p>
                </motion.div>
              )}

              {/* Request OTP Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleRequestOtp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Request OTP
                  </>
                )}
              </motion.button>

              {/* Back to Login */}
              <p className="text-center text-sm text-slate-400">
                Already verified?{" "}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate("/login")}
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Back to login
                </motion.button>
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="space-y-4">
              {/* OTP Inputs */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Enter OTP
                </label>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-center text-3xl font-bold rounded-lg px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition letter-spacing"
                />
              </div>

              {/* Timer */}
              {timer > 0 && (
                <p className="text-center text-sm text-slate-400">
                  Resend OTP in <span className="font-semibold text-blue-400">{timer}s</span>
                </p>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Success */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-400">{success}</p>
                </motion.div>
              )}

              {/* Verify Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify Account
                  </>
                )}
              </motion.button>

              {/* Resend OTP Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleResendOtp}
                disabled={!canResend || loading}
                className="w-full bg-slate-700 text-slate-300 font-semibold py-2 rounded-lg hover:bg-slate-600 transition disabled:opacity-50 text-sm"
              >
                {loading ? "Resending..." : "Resend OTP"}
              </motion.button>

              {/* Back Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(1)}
                className="w-full bg-slate-800 text-slate-300 font-semibold py-2 rounded-lg hover:bg-slate-700 transition text-sm"
              >
                Back
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AccountVerification;
