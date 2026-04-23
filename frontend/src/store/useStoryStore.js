import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useStoryStore = create((set, get) => ({
  feed: [], // [{ owner, stories: [{...}], hasUnopened }]
  isLoading: false,
  isUploading: false,
  activeOwner: null, // { owner, stories }
  isCreatorOpen: false,
  badgeCount: 0,

  getFeed: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/stories/feed");
      set({ feed: res.data || [] });
      // Compute badge
      const unopened = (res.data || []).filter((g) => g.hasUnopened).length;
      set({ badgeCount: unopened });
    } catch (error) {
      console.error("getFeed error", error);
    } finally {
      set({ isLoading: false });
    }
  },

  openOwner: (group) => {
    set({ activeOwner: group, isCreatorOpen: false });
  },
  closeViewer: () => set({ activeOwner: null, isCreatorOpen: false }),
  openCreator: () => set({ isCreatorOpen: true, activeOwner: null }),
  closeCreator: () => set({ isCreatorOpen: false }),
  cleanupStories: () => set({ activeOwner: null, isCreatorOpen: false }),

  uploadStory: async ({ media, mediaType, durationDays, textOverlay }) => {
    try {
      set({ isUploading: true });
      const res = await axiosInstance.post("/stories", { media, mediaType, durationDays, textOverlay });
      toast.success("Story uploaded");
      await get().getFeed();
      // Close creator after successful upload
      set({ isCreatorOpen: false });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload story");
      throw error;
    } finally {
      set({ isUploading: false });
    }
  },

  markSeen: async (storyId) => {
    try {
      await axiosInstance.post(`/stories/${storyId}/seen`);
      await get().getFeed();
    } catch (error) {
      console.error("markSeen error", error);
    }
  },

  refreshBadge: async () => {
    try {
      const res = await axiosInstance.get("/stories/unopened-count");
      set({ badgeCount: res.data?.count || 0 });
    } catch (error) {
      console.error("refreshBadge error", error);
    }
  },
}));
