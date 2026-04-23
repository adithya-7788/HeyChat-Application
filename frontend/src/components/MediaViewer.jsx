import { useMediaViewerStore } from "../store/useMediaViewerStore";
import { X } from "lucide-react";

const MediaViewer = () => {
  const { isOpen, mediaUrl, mediaType, closeMedia } = useMediaViewerStore();

  if (!isOpen || !mediaUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <button
        className="absolute top-4 right-4 text-white hover:text-zinc-300"
        onClick={closeMedia}
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-3xl max-h-[80vh] w-full px-4">
        <div className="bg-base-100 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
          {mediaType === "image" ? (
            <img src={mediaUrl} alt="Media" className="max-h-[80vh] w-auto object-contain" />
          ) : (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-h-[80vh] w-full object-contain"
              onEnded={closeMedia}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;

