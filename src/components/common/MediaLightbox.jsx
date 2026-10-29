import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, Download, ExternalLink } from "lucide-react";

export default function MediaLightbox({ src, alt = "Media preview", isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !src) return null;

  return createPortal(
    <MediaLightboxModal src={src} alt={alt} onClose={onClose} />,
    document.body
  );
}

function MediaLightboxModal({ src, alt, onClose }) {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "+" || e.key === "=") {
        setScale((prev) => Math.min(prev + 0.5, 3));
      } else if (e.key === "-") {
        setScale((prev) => Math.max(prev - 0.5, 1));
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const toggleZoom = (e) => {
    e.stopPropagation();
    if (scale > 1) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };

  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setScale((prev) => {
      const next = Math.min(Math.max(prev + delta, 1), 3.5);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = alt.replace(/[^a-zA-Z0-9_-]/g, "_") || "circlehub-media";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(src, "_blank");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-md transition-opacity duration-200 select-none animate-in fade-in"
      onClick={onClose}
    >
      {/* Top action toolbar */}
      <div
        className="absolute top-4 right-4 z-[110] flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-lg px-3 py-1.5 border border-white/10 text-white/90 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={toggleZoom}
          className="p-2 rounded-full hover:bg-white/15 transition-colors text-white"
          title={scale > 1 ? "Reset zoom (Esc)" : "Zoom in"}
        >
          {scale > 1 ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
        </button>

        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full hover:bg-white/15 transition-colors text-white"
          title="Open original in new tab"
        >
          <ExternalLink size={18} />
        </a>

        <button
          type="button"
          onClick={handleDownload}
          className="p-2 rounded-full hover:bg-white/15 transition-colors text-white"
          title="Download image"
        >
          <Download size={18} />
        </button>

        <div className="h-4 w-px bg-white/20 mx-1" />

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/20 hover:text-white transition-colors text-white/80"
          title="Close (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        className="relative max-h-[90vh] max-w-[95vw] flex items-center justify-center overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          onDoubleClick={toggleZoom}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          draggable={false}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
          }}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-transform will-change-transform"
        />
      </div>

      {/* Hint at bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-wide pointer-events-none">
        {scale > 1 ? "Drag to pan • Double-click or scroll to zoom" : "Double-click or scroll to zoom • Click outside to close"}
      </div>
    </div>
  );
}
