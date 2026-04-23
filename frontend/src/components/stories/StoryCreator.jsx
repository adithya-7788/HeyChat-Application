import { useRef, useState } from "react";
import { useStoryStore } from "../../store/useStoryStore";
import { Upload, AlertCircle } from "lucide-react";

const StoryCreator = () => {
  const { uploadStory, isLoading } = useStoryStore();
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [durationDays, setDurationDays] = useState(1);
  const fileInputRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMedia(reader.result);
      setMediaType(file.type.startsWith("video") ? "video" : "image");
    };
    reader.readAsDataURL(file);
  };

  const onUpload = async () => {
    if (!media || !mediaType) return;
    try {
      await uploadStory({ media, mediaType, durationDays, textOverlay: {} });
      // Reset state after upload
      setMedia(null);
      setMediaType(null);
      setDurationDays(1);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      // Error is already handled in the store
      console.error("Upload error:", error);
    }
  };

  const onClear = () => {
    setMedia(null);
    setMediaType(null);
    setDurationDays(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-base-100 p-8">
      {/* Duration selector at top */}
      <div className="mb-8">
        <label className="text-sm font-medium mb-3 block">Story duration</label>
        <div className="flex gap-2">
          {[1, 2, 3].map((days) => (
            <button
              key={days}
              onClick={() => setDurationDays(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                durationDays === days
                  ? "bg-primary text-primary-content"
                  : "bg-base-200 text-base-content hover:bg-base-300"
              }`}
            >
              {days} day{days > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* File selection or preview */}
      {!media ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="w-24 h-24 rounded-full bg-base-200 flex items-center justify-center">
            <Upload className="w-12 h-12 text-base-content/40" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold mb-1">Add a story</p>
            <p className="text-sm text-base-content/60 mb-6">
              Share an image or video with your friends
            </p>
          </div>
          <label className="btn btn-primary">
            Select File
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={onFile}
              className="hidden"
            />
          </label>
          <p className="text-xs text-base-content/50 text-center max-w-xs">
            Supported formats: JPEG, PNG, GIF for images; MP4, WebM for videos
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="max-h-96 rounded-2xl overflow-hidden shadow-lg">
            {mediaType === "image" ? (
              <img src={media} alt="preview" className="max-h-96 max-w-sm object-contain" />
            ) : (
              <video src={media} className="max-h-96 max-w-sm object-contain" controls />
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClear} className="btn btn-ghost btn-sm">
              Change
            </button>
            <button
              onClick={onUpload}
              disabled={isLoading}
              className={`btn btn-primary btn-sm ${isLoading ? "loading" : ""}`}
            >
              {isLoading ? "Uploading..." : "Share Story"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCreator;
