import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useFriendStore = create((set, get) => ({
  friends: [],
  friendRequests: {
    sent: [],
    received: [],
  },
  isFriendsLoading: false,
  isRequestsLoading: false,
  isSendingRequest: false,

  getFriends: async () => {
    set({ isFriendsLoading: true });
    try {
      const res = await axiosInstance.get("/friends/friends");
      set({ friends: res.data });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to load friends";
      console.error("Get friends error:", error);
    } finally {
      set({ isFriendsLoading: false });
    }
  },

  getFriendRequests: async () => {
    set({ isRequestsLoading: true });
    try {
      const res = await axiosInstance.get("/friends");
      set({ friendRequests: res.data });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to load friend requests";
      console.error("Get friend requests error:", error);
    } finally {
      set({ isRequestsLoading: false });
    }
  },

  sendFriendRequest: async (receiverId) => {
    set({ isSendingRequest: true });
    try {
      const res = await axiosInstance.post("/friends/send", { receiverId });
      toast.success("Friend request sent");
      await get().getFriendRequests();
      return res.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to send friend request";
      toast.error(errorMessage);
      console.error("Send friend request error:", error);
      throw error;
    } finally {
      set({ isSendingRequest: false });
    }
  },

  acceptFriendRequest: async (requestId) => {
    try {
      await axiosInstance.post(`/friends/accept/${requestId}`);
      toast.success("Friend request accepted");
      await get().getFriendRequests();
      await get().getFriends();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to accept friend request";
      toast.error(errorMessage);
      console.error("Accept friend request error:", error);
    }
  },

  rejectFriendRequest: async (requestId) => {
    try {
      await axiosInstance.post(`/friends/reject/${requestId}`);
      toast.success("Friend request rejected");
      await get().getFriendRequests();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to reject friend request";
      toast.error(errorMessage);
      console.error("Reject friend request error:", error);
    }
  },
}));
