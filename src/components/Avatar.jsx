import React from "react";

const Avatar = ({
  profilePicture,
  fullName,
  username,
  size = "md",
  className = "",
  onClick,
}) => {
  // Size mappings
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-16 h-16 text-2xl",
    xl: "w-20 h-20 text-3xl",
    "2xl": "w-28 h-28 text-4xl",
    "3xl": "w-36 h-36 text-5xl",
  };

  // Color palette for initials
  const colors = [
    { bg: "bg-red-500", text: "text-red-50" },
    { bg: "bg-orange-500", text: "text-orange-50" },
    { bg: "bg-yellow-500", text: "text-yellow-50" },
    { bg: "bg-green-500", text: "text-green-50" },
    { bg: "bg-blue-500", text: "text-blue-50" },
    { bg: "bg-indigo-500", text: "text-indigo-50" },
    { bg: "bg-purple-500", text: "text-purple-50" },
    { bg: "bg-pink-500", text: "text-pink-50" },
    { bg: "bg-emerald-500", text: "text-emerald-50" },
    { bg: "bg-cyan-500", text: "text-cyan-50" },
  ];

  // Get deterministic color based on username/fullName
  const getColor = () => {
    const identifier = fullName || username || "user";
    const charCode = identifier.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // Get initials
  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return username?.charAt(0)?.toUpperCase() || "?";
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const color = getColor();
  const initials = getInitials();

  // If profile picture exists and is not a placeholder, show it
  const isPlaceholder = profilePicture === "/avatar.png" || profilePicture === "avatar.png" || !profilePicture;

  if (!isPlaceholder) {
    return (
      <img
        src={profilePicture}
        alt={fullName || username}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
        onClick={onClick}
      />
    );
  }

  // Otherwise, show initials avatar
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 font-bold ${color.bg} ${color.text} ${className}`}
      onClick={onClick}
    >
      {initials}
    </div>
  );
};

export default Avatar;
