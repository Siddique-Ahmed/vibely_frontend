import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../redux/slices/authSlice";
import apiClient from "../services/apiClient";
import {
  Camera, FileText, MapPin, Link2,
  ChevronRight, Loader2, SkipForward, CheckCircle2,
} from "lucide-react";

const CompleteProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [profilePicture, setProfilePicture] = useState(null);
  const [coverPicture,   setCoverPicture]   = useState(null);
  const [preview,        setPreview]        = useState(null);
  const [coverPreview,   setCoverPreview]   = useState(null);
  const [bio,      setBio]      = useState("");
  const [address,  setAddress]  = useState("");
  const [website,  setWebsite]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const fileInputRef  = useRef(null);
  const coverInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfilePicture(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverPicture(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (profilePicture) formData.append("profile_picture", profilePicture);
      if (coverPicture)   formData.append("cover_picture",   coverPicture);
      if (bio)     formData.append("bio",     bio);
      if (address) formData.append("address", address);
      if (website) formData.append("website", website);

      const res = await apiClient.put("/users/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = res.data?.data || res.data?.user || res.data;
      if (updatedUser) dispatch(setUser(updatedUser));

      setSaved(true);
      setTimeout(() => navigate("/feed"), 1200);
    } catch (err) {
      console.error("Profile update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => navigate("/feed");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0117 0%, #1a0533 40%, #0d1117 100%)",
      }}
    >
      {/* BG blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #7C3AED, transparent)" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-15 blur-3xl"
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
            background: "rgba(15, 1, 30, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(124, 58, 237, 0.3)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="inline-block mb-4"
              style={{
                padding: "3px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)",
                boxShadow: "0 0 30px rgba(124,58,237,0.5)",
              }}
            >
              <div
                className="w-16 h-16 rounded-[17px] overflow-hidden flex items-center justify-center"
                style={{ background: "#ffffff" }}
              >
                <img src="/vibely_logo.png" alt="Vibely" className="w-14 h-14 object-contain" />
              </div>
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Complete Your Profile
            </h1>
            <p className="text-slate-400 text-sm">
              Let people know who you are. You can skip and do this later.
            </p>
          </div>

          {/* Cover Photo Upload */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Cover Photo (optional)</label>
            <div
              className="relative w-full h-28 rounded-2xl overflow-hidden cursor-pointer"
              style={{
                background: coverPreview ? undefined : "linear-gradient(135deg,#4C1D95,#7C3AED,#EC4899,#F97316)",
                border: "1px solid rgba(124,58,237,0.3)",
              }}
              onClick={() => coverInputRef.current?.click()}
            >
              {coverPreview && <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="flex items-center gap-2 text-white text-xs font-medium bg-black/40 px-3 py-1.5 rounded-lg">
                  <Camera size={13} /> {coverPreview ? "Change Cover" : "Add Cover Photo"}
                </div>
              </div>
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>

          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-7">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div
                className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                style={{
                  background: preview ? "transparent" : "linear-gradient(135deg, #7C3AED33, #EC4899 33)",
                  border: "3px solid rgba(124,58,237,0.4)",
                  boxShadow: "0 0 30px rgba(124,58,237,0.2)",
                }}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={28} className="text-purple-400" />
                )}
              </div>
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                <Camera size={22} className="text-white" />
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
              >
                <Camera size={13} className="text-white" />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <p className="text-xs text-slate-500 mt-2">Tap to upload profile photo</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <FileText size={14} className="text-purple-400" /> Bio
              </label>
              <textarea
                placeholder="Tell people about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={160}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}
              />
              <p className="text-right text-xs text-slate-600 mt-1">{bio.length}/160</p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <MapPin size={14} className="text-pink-400" /> Location
              </label>
              <input
                type="text"
                placeholder="City, Country"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(236,72,153,0.25)",
                }}
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Link2 size={14} className="text-orange-400" /> Website
              </label>
              <input
                type="url"
                placeholder="https://yourwebsite.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(249,115,22,0.25)",
                }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-7">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSkip}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <SkipForward size={15} /> Skip
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={loading || saved}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)",
                boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
              }}
            >
              {saved ? (
                <>
                  <CheckCircle2 size={16} /> Saved!
                </>
              ) : loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  Save Profile <ChevronRight size={16} />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;
