import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  searchResults: [],
  exploreUsers: [],
  isSearching: false,
  isExploring: false,

  searchUsers: async (query) => {
    if (!query || query.trim().length === 0) {
      set({ searchResults: [] });
      return;
    }

    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(`/users/search?query=${encodeURIComponent(query)}`);
      set({ searchResults: res.data });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to search users";
      toast.error(errorMessage);
      console.error("Search users error:", error);
      set({ searchResults: [] });
    } finally {
      set({ isSearching: false });
    }
  },

  getExploreUsers: async () => {
    set({ isExploring: true });
    try {
      const res = await axiosInstance.get("/users/explore?limit=10");
      set({ exploreUsers: res.data });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to load users";
      toast.error(errorMessage);
      console.error("Get explore users error:", error);
      set({ exploreUsers: [] });
    } finally {
      set({ isExploring: false });
    }
  },
}));
