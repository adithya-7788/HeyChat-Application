import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || "luxury",
  setTheme: async (theme) => {
    try {
      localStorage.setItem("chat-theme", theme);
      set({ theme });
      // Persist theme to backend
      await axiosInstance.put("/auth/update-theme", { theme });
    } catch (error) {
      console.error("Error saving theme:", error);
      // Still update locally even if backend fails
      set({ theme });
    }
  },
}));
