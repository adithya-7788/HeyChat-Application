import { create } from "zustand";

export const useMediaViewerStore = create((set, get) => ({
  isOpen: false,
  mediaUrl: null,
  mediaType: null, // "image" | "video"
  autoCloseMs: null,

  openMedia: (mediaUrl, mediaType, options = {}) => {
    const autoCloseMs = mediaType === "image" ? options.autoCloseMs || 5000 : null;
    set({ isOpen: true, mediaUrl, mediaType, autoCloseMs });

    if (autoCloseMs) {
      setTimeout(() => {
        if (get().mediaUrl === mediaUrl) {
          set({ isOpen: false, mediaUrl: null, mediaType: null, autoCloseMs: null });
        }
      }, autoCloseMs);
    }
  },

  closeMedia: () => {
    set({ isOpen: false, mediaUrl: null, mediaType: null, autoCloseMs: null });
  },
}));

