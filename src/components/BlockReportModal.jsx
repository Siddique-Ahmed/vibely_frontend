import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../services/apiClient";
import {
  ShieldBan, Flag, X, ChevronRight, Loader2,
  CheckCircle2, AlertTriangle,
} from "lucide-react";

const REPORT_REASONS = [
  "Spam",
  "Harassment or bullying",
  "Hate speech",
  "Violence or threats",
  "False information",
  "Nudity or sexual content",
  "Self-harm or suicide",
  "Other",
];

const BlockReportModal = ({ targetUser, onClose, onBlockSuccess }) => {
  const [screen, setScreen] = useState("menu"); // menu | report | done
  const [action, setAction] = useState(null);   // "block" | "report"
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleBlock = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post(`/blocks/toggle/${targetUser._id}`);
      const isBlocked = res.data?.data?.isBlocked ?? true;
      setMessage(isBlocked ? "User blocked successfully." : "User unblocked.");
      setScreen("done");
      onBlockSuccess?.(isBlocked);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to block user.");
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reason) { setError("Please select a reason."); return; }
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/reports/create", {
        reportedUserId: targetUser._id,
        reason,
      });
      setMessage("Report submitted. We'll review it shortly.");
      setScreen("done");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="bg-white dark:bg-slate-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              {screen === "menu"   ? `@${targetUser?.username}` :
               screen === "report" ? "Report User" : ""}
            </h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          {/* ── MENU ── */}
          {screen === "menu" && (
            <div className="py-2">
              <button
                onClick={() => { setAction("block"); handleBlock(); }}
                disabled={loading}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                  <ShieldBan size={18} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-500">Block User</p>
                  <p className="text-xs text-slate-400 mt-0.5">They won't see your content</p>
                </div>
                {loading && action === "block"
                  ? <Loader2 size={16} className="animate-spin text-slate-400" />
                  : <ChevronRight size={16} className="text-slate-400" />}
              </button>

              <button
                onClick={() => { setScreen("report"); setAction("report"); }}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                  <Flag size={18} className="text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-500">Report User</p>
                  <p className="text-xs text-slate-400 mt-0.5">Report inappropriate behaviour</p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              {error && (
                <p className="px-5 pb-3 text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle size={12} /> {error}
                </p>
              )}
            </div>
          )}

          {/* ── REPORT REASONS ── */}
          {screen === "report" && (
            <div>
              <div className="px-5 py-3 max-h-72 overflow-y-auto space-y-1">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                      reason === r
                        ? "text-white"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    style={reason === r ? { background: "linear-gradient(135deg,#7C3AED,#EC4899)" } : {}}
                  >
                    {r}
                    {reason === r && <CheckCircle2 size={15} className="text-white" />}
                  </button>
                ))}
              </div>
              {error && (
                <p className="px-5 text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle size={12} /> {error}
                </p>
              )}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button onClick={() => setScreen("menu")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Back
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleReport} disabled={loading || !reason}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit Report"}
                </motion.button>
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {screen === "done" && (
            <div className="flex flex-col items-center justify-center px-6 py-8 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <p className="text-slate-900 dark:text-white font-semibold">{message}</p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                className="mt-2 px-6 py-2.5 text-white rounded-xl text-sm font-medium"
                style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                Done
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BlockReportModal;
