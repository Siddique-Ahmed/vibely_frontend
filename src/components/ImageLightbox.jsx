import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";

const ImageLightbox = ({ src, alt, onClose }) => {
  if (!src) return null;
  return (
    <AnimatePresence>
      <motion.div
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-80 flex items-center justify-center bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition z-10"
        >
          <X size={20} />
        </button>

        {/* Download button */}
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-16 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition z-10"
        >
          <Download size={18} />
        </a>

        {/* Image */}
        <motion.img
          src={src}
          alt={alt || "Image"}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-[92vw] max-h-[92vh] object-contain rounded-2xl shadow-2xl select-none"
          draggable={false}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageLightbox;
