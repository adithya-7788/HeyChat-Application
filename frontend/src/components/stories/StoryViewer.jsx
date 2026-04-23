import { useEffect, useRef, useState, useCallback } from "react";
import { useStoryStore } from "../../store/useStoryStore";
import { X } from "lucide-react";

const ProgressBar = ({ segments, activeIndex, progress }) => {
  return (
    <div className="w-full flex gap-2 p-3">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1.5 rounded bg-white/30"
        >
          <div
            className={`h-1.5 rounded ${i < activeIndex ? "bg-white" : i === activeIndex ? "bg-white" : "bg-transparent"}`}
            style={{ width: i === activeIndex ? `${Math.min(100, Math.max(0, progress))}%` : i < activeIndex ? "100%" : "0%" }}
          />
        </div>
      ))}
    </div>
  );
};

const StoryViewer = ({ group, isMobile, onClose }) => {
  const { markSeen, closeViewer } = useStoryStore();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  const stories = group?.stories || [];
  const current = stories[index];

  // Use custom onClose handler if provided, otherwise use store's closeViewer
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      closeViewer();
    }
  }, [onClose, closeViewer]);

  // Close viewer if no stories available
  useEffect(() => {
    if (stories.length === 0) {
      handleClose();
    }
  }, [stories.length, handleClose]);

  // Handle tap to advance or close
  const handleContentTap = () => {
    // Clear current timer
    clearInterval(timerRef.current);
    
    // If there's a next story, advance to it
    if (index + 1 < stories.length) {
      setIndex(index + 1);
      setProgress(0);
    } else {
      // Last story - close viewer
      handleClose();
    }
  };

  // Auto-disappear when story finishes
  useEffect(() => {
    if (!current) return;
    markSeen(current._id);

    setProgress(0);
    clearInterval(timerRef.current);

    if (current.mediaType === "image") {
      const durationMs = 5000; // 5s
      const step = durationMs / 100; // 100 steps
      timerRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(timerRef.current);
            // Check if this is the last story
            if (index + 1 >= stories.length) {
              // Auto-disappear when finished
              handleClose();
              return 100;
            }
            setIndex((i) => i + 1);
            return 100;
          }
          return p + 1;
        });
      }, step);
    } else {
      // video
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.play().catch(() => {});
        const maxDuration = 30; // seconds
        const effectiveDuration = Math.min(maxDuration, video.duration || maxDuration);
        const stepMs = (effectiveDuration * 1000) / 100;
        timerRef.current = setInterval(() => {
          setProgress((p) => {
            if (p >= 100) {
              clearInterval(timerRef.current);
              // Check if this is the last story
              if (index + 1 >= stories.length) {
                // Auto-disappear when finished
                handleClose();
                return 100;
              }
              setIndex((i) => i + 1);
              return 100;
            }
            return p + 1;
          });
        }, stepMs);
      }
    }

    return () => {
      clearInterval(timerRef.current);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [current, stories.length, index, markSeen, handleClose]);

  if (!current) return (
    <div className="flex-1 flex items-center justify-center text-sm text-base-content/60">No stories</div>
  );

  return (
    <div className="flex-1 flex flex-col bg-black relative">
      {/* Close button - top right */}
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        title="Close story"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <ProgressBar segments={stories.length} activeIndex={index} progress={progress} />
      <div 
        className="flex-1 flex items-center justify-center cursor-pointer"
        onClick={handleContentTap}
      >
        {current.mediaType === "image" ? (
          <img src={current.mediaUrl} alt="story" className="max-h-full max-w-full object-contain" />
        ) : (
          <video ref={videoRef} src={current.mediaUrl} className="max-h-full max-w-full" muted />
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
