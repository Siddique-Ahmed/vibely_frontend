import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useCreatePost } from "../hooks/useApi";
import {
  X,
  Image,
  MapPin,
  Smile,
  Send,
  Loader2,
  Trash2,
  Globe,
  Users,
  UserCheck,
  Lock,
} from "lucide-react";
import MentionSuggestions from "./MentionSuggestions";
import Avatar from "./Avatar";

const CreatePostModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useSelector((state) => state.auth);
  const [caption,       setCaption]       = useState("");
  const [mediaFiles,    setMediaFiles]    = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [location,      setLocation]      = useState("");      // display name shown in pill
  const [locationData,  setLocationData]  = useState(null);    // full location data with coordinates
  const [locationQuery, setLocationQuery] = useState("");      // search input text
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationLoading,     setLocationLoading]     = useState(false);
  const [showLocationInput,   setShowLocationInput]   = useState(false);
  const [isPosting,     setIsPosting]     = useState(false);
  const [step,          setStep]          = useState("compose");
  const [visibility,   setVisibility]    = useState("public");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPos,    setCursorPos]    = useState(0);
  const fileInputRef   = useRef(null);
  const locationTimer  = useRef(null);
  const { mutate: createPost } = useCreatePost();

  const visibilityOptions = [
    { value: "public", label: "Public", icon: Globe, description: "Anyone can see" },
    { value: "followers", label: "Followers", icon: Users, description: "Only followers can see" },
    { value: "close_friends", label: "Close Friends", icon: UserCheck, description: "Only close friends can see" },
    { value: "private", label: "Private", icon: Lock, description: "Only you can see" },
  ];

  // Nominatim geocoder — free, no API key
  const searchLocation = (query) => {
    setLocationQuery(query);
    clearTimeout(locationTimer.current);
    if (!query.trim()) { setLocationSuggestions([]); return; }
    locationTimer.current = setTimeout(async () => {
      setLocationLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setLocationSuggestions(data);
      } catch { setLocationSuggestions([]); }
      finally { setLocationLoading(false); }
    }, 400);
  };

  const selectLocation = (place) => {
    const displayName = place.display_name.split(",").slice(0, 3).join(", ");
    setLocation(displayName);
    setLocationData({
      name: displayName,
      address: place.display_name,
      coordinates: [parseFloat(place.lon), parseFloat(place.lat)],
      placeId: place.place_id,
      type: place.type,
    });
    setLocationQuery("");
    setLocationSuggestions([]);
    setShowLocationInput(false);
  };

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaFiles.length > 10) {
      alert("Maximum 10 media files allowed");
      return;
    }

    const newFiles = [...mediaFiles, ...files];
    setMediaFiles(newFiles);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaPreviews((prev) => [
          ...prev,
          {
            url: event.target.result,
            type: file.type.startsWith("image") ? "image" : "video",
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCaptionChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setCaption(value);
    setCursorPos(position);

    // Mention detection logic
    const textBeforeCursor = value.substring(0, position);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      const query = textBeforeCursor.substring(lastAtIdx + 1);
      // Ensure no space between @ and cursor
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleMentionSelect = (username) => {
    const textBeforeAt = caption.substring(0, caption.lastIndexOf("@", cursorPos - 1));
    const textAfterCursor = caption.substring(cursorPos);
    const newCaption = `${textBeforeAt}@${username} ${textAfterCursor}`;
    setCaption(newCaption);
    setShowMentions(false);
  };

  const handleRemoveMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!caption.trim() && mediaFiles.length === 0) {
      return;
    }

    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("visibility", visibility);
      if (locationData) {
        formData.append("location", JSON.stringify(locationData));
      }
      mediaFiles.forEach((file) => formData.append("media", file));

      createPost(formData, {
        onSuccess: () => {
          onSuccess?.();
          handleClose();
        },
        onError: (err) => {
          console.error("Post error:", err);
        },
        onSettled: () => {
          setIsPosting(false);
        },
      });
    } catch (err) {
      setIsPosting(false);
    }
  };

  const handleClose = () => {
    setCaption("");
    setMediaFiles([]);
    setMediaPreviews([]);
    setLocation("");
    setLocationData(null);
    setLocationQuery("");
    setLocationSuggestions([]);
    setShowLocationInput(false);
    setIsPosting(false);
    setVisibility("public");
    onClose();
  };

  const canPost = caption.trim().length > 0 || mediaFiles.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-500"
              >
                <X size={20} />
              </button>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Create Post</h2>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePost}
                disabled={!canPost || isPosting}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold transition ${canPost && !isPosting ? "text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}
                style={canPost && !isPosting ? { background: "linear-gradient(135deg,#7C3AED,#EC4899)", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" } : {}}>
                {isPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={2.5} />}
                {isPosting ? "Posting..." : "Post"}
              </motion.button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto pb-20 sm:pb-0">
              {/* User Info */}
              <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                <Avatar
                  profilePicture={user?.profile?.profile_picture}
                  fullName={user?.profile?.full_name}
                  username={user?.username}
                  size="md"
                  className="border-2 border-slate-200 dark:border-slate-700"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.profile?.full_name || user?.username}
                  </p>
                  <p className="text-xs text-slate-500">@{user?.username}</p>
                </div>
              </div>

              {/* Caption */}
              <div className="px-5 pb-3 relative">
                <textarea
                  placeholder="What's on your mind?"
                  value={caption}
                  onChange={handleCaptionChange}
                  onKeyUp={(e) => setCursorPos(e.target.selectionStart)}
                  onBlur={() => setTimeout(() => setShowMentions(false), 200)}
                  rows={4}
                  className="w-full text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent focus:outline-none resize-none leading-relaxed"
                />
                <AnimatePresence>
                  {showMentions && (
                    <div className="absolute top-full left-0 z-[1000] mt-1">
                      <MentionSuggestions query={mentionQuery} onSelect={handleMentionSelect} placement="bottom-full" />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Media Previews */}
              {mediaPreviews.length > 0 && (
                <div className="px-5 pb-4">
                  <div
                    className={`grid gap-2 ${
                      mediaPreviews.length === 1
                        ? "grid-cols-1"
                        : mediaPreviews.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-2"
                    }`}
                  >
                    {mediaPreviews.map((preview, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800"
                        style={{ aspectRatio: mediaPreviews.length === 1 ? "16/9" : "1" }}
                      >
                        {preview.type === "image" ? (
                          <img
                            src={preview.url}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={preview.url}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          onClick={() => handleRemoveMedia(idx)}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  {mediaPreviews.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full mt-2 py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-500 transition"
                    >
                      + Add more ({mediaPreviews.length}/10)
                    </button>
                  )}
                </div>
              )}

              {/* Location — selected pill */}
              {location && (
                <div className="px-5 pb-3">
                  <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full text-sm">
                    <MapPin size={14} />
                    <span className="font-medium">{location}</span>
                    <button onClick={() => { setLocation(""); setLocationData(null); }} className="ml-1 hover:text-orange-800 transition">
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Location — search dropdown */}
              {showLocationInput && !location && (
                <div className="px-5 pb-4 relative">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <MapPin size={15} className="text-orange-500 flex-shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search for a place..."
                      value={locationQuery}
                      onChange={(e) => searchLocation(e.target.value)}
                      className="flex-1 text-sm bg-transparent focus:outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    />
                    {locationLoading && <Loader2 size={14} className="animate-spin text-slate-400" />}
                    <button onClick={() => { setShowLocationInput(false); setLocationSuggestions([]); setLocationQuery(""); }}
                      className="text-slate-400 hover:text-slate-600">
                      <X size={13} />
                    </button>
                  </div>
                  {locationSuggestions.length > 0 && (
                    <div className="absolute left-5 right-5 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20 max-h-64 overflow-y-auto">
                      {locationSuggestions.map((place) => {
                        const parts = place.display_name.split(",").map(p => p.trim());
                        const mainName = parts[0];
                        const location = parts.slice(1, 3).join(", ");
                        return (
                          <button key={place.place_id} onClick={() => selectLocation(place)}
                            className="w-full text-left flex flex-col gap-1 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition border-b border-slate-100 dark:border-slate-700 last:border-0">
                            <div className="flex items-center gap-2">
                              <MapPin size={13} className="text-orange-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                                {mainName}
                              </span>
                            </div>
                            {location && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-5">
                                {location}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Toolbar */}
            <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center gap-3 shrink-0 bg-white dark:bg-slate-900 relative z-0">
              {/* Visibility Selector */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep(step === "visibility" ? "compose" : "visibility")}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  {(() => {
                    const selectedOption = visibilityOptions.find(opt => opt.value === visibility);
                    const IconComponent = selectedOption?.icon;
                    return IconComponent ? <IconComponent size={16} /> : null;
                  })()}
                  <span className="hidden sm:inline">
                    {visibilityOptions.find(opt => opt.value === visibility)?.label}
                  </span>
                </motion.button>

                {/* Visibility Options Dropdown */}
                <AnimatePresence>
                  {step === "visibility" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-30 min-w-[200px]"
                    >
                      {visibilityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setVisibility(option.value);
                            setStep("compose");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left"
                        >
                          <option.icon size={18} className="text-slate-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {option.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {option.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600" />

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Add:</p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                className="hidden"
              />

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={mediaFiles.length >= 10}
                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition text-blue-500 disabled:opacity-40"
                title="Add Photo/Video"
              >
                <Image size={18} strokeWidth={1.8} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowLocationInput(!showLocationInput)}
                className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition text-orange-500"
                title="Add Location"
              >
                <MapPin size={18} strokeWidth={1.8} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition text-yellow-500"
                title="Add Feeling"
              >
                <Smile size={20} strokeWidth={1.8} />
              </motion.button>

              <div className="ml-auto">
                <p className={`text-xs font-medium ${caption.length > 2200 ? "text-red-500" : "text-slate-400"}`}>
                  {caption.length}/2200
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
