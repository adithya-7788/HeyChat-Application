import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  conversations: [],
  // activeConversation: { type: "direct" | "group", user, group }
  activeConversation: null,
  unreadSummary: {},
  isUsersLoading: false,
  isConversationsLoading: false,
  isMessagesLoading: false,
  isSelectionMode: false,
  selectedMessages: new Set(),
  messageReadStatus: null,
  isReadStatusLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to load users";
      toast.error(errorMessage);
      console.error("Get users error:", error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getConversations: async () => {
    set({ isConversationsLoading: true });
    try {
      const res = await axiosInstance.get("/messages/conversations");
      set({ conversations: res.data || [] });
      await get().getUnreadSummary();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to load conversations";
      console.error("Get conversations error:", error);
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  getMessages: async () => {
    const { activeConversation } = get();
    if (!activeConversation) return;

    set({ isMessagesLoading: true });

    try {
      let res;
      if (activeConversation.type === "direct") {
        const userId = activeConversation.user._id;
        res = await axiosInstance.get(`/messages/${userId}`);
        set({ messages: res.data });

        // Mark messages as seen when opening conversation
        try {
          await axiosInstance.post(`/messages/${userId}/seen`);
          await get().getUnreadSummary();
          // Debounced refresh to prevent race conditions
          setTimeout(() => get().getConversations(), 100);
        } catch (error) {
          console.error("Mark messages as seen error:", error);
        }
      } else if (activeConversation.type === "group") {
        const groupId = activeConversation.group._id;
        res = await axiosInstance.get(`/messages/group/${groupId}`);
        set({ messages: res.data });

        // Mark group messages as seen when opening conversation
        try {
          await axiosInstance.post(`/messages/group/${groupId}/seen`);
          await get().getUnreadSummary();
          // Debounced refresh to prevent race conditions
          setTimeout(() => get().getConversations(), 100);
        } catch (error) {
          console.error("Mark group messages as seen error:", error);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to load messages";
      toast.error(errorMessage);
      console.error("Get messages error:", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { activeConversation, messages } = get();
    if (!activeConversation) return;

    try {
      let res;
      if (activeConversation.type === "direct") {
        res = await axiosInstance.post(
          `/messages/send/${activeConversation.user._id}`,
          messageData
        );
      } else {
        res = await axiosInstance.post(
          `/messages/group/${activeConversation.group._id}`,
          messageData
        );
      }

      set({ messages: [...messages, res.data] });
      // Debounced conversation refresh to prevent race conditions
      setTimeout(() => get().getConversations(), 100);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to send message";
      toast.error(errorMessage);
      console.error("Send message error:", error);
    }
  },

  openDirectChat: (user) => {
    const socket = useAuthStore.getState().socket;
    // leave any previous group room
    const current = get().activeConversation;
    if (current?.type === "group" && socket) {
      socket.emit("leaveGroup", current.group._id);
    }
    // Close profile view when switching conversations
    set({ 
      activeConversation: { type: "direct", user },
      isProfileViewOpen: false,
      isSelectionMode: false,
      selectedMessages: new Set(),
      messageReadStatus: null,
    });
  },

  openGroupChat: (group) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("joinGroup", group._id);
    }
    // Close profile view when switching conversations
    set({ 
      activeConversation: { type: "group", group },
      isProfileViewOpen: false,
      isSelectionMode: false,
      selectedMessages: new Set(),
      messageReadStatus: null,
    });
  },

  closeConversation: () => {
    const socket = useAuthStore.getState().socket;
    const current = get().activeConversation;
    if (current?.type === "group" && socket) {
      socket.emit("leaveGroup", current.group._id);
    }
    set({ 
      activeConversation: null, 
      messages: [],
      isProfileViewOpen: false,
      isSelectionMode: false,
      selectedMessages: new Set(),
      messageReadStatus: null,
    });
  },
  getUnreadSummary: async () => {
    try {
      const res = await axiosInstance.get("/messages/unread-summary/all");
      // Response is expected as { [userId]: count }
      set({ unreadSummary: res.data || {} });
    } catch (error) {
      console.error("Get unread summary error:", error);
    }
  },

  isProfileViewOpen: false,
  openProfileView: () => set({ isProfileViewOpen: true }),
  closeProfileView: () => set({ isProfileViewOpen: false }),

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Clean up existing listeners first to prevent duplicates
    socket.off("newMessage");
    socket.off("newGroupMessage");

    socket.on("newMessage", (newMessage) => {
      const { activeConversation, messages } = get();
      const isFromCurrent =
        activeConversation &&
        activeConversation.type === "direct" &&
        (newMessage.senderId === activeConversation.user._id ||
          newMessage.receiverId === activeConversation.user._id);
      
      if (isFromCurrent) {
        set({ messages: [...messages, newMessage] });
      }
      
      // Debounced refresh to prevent multiple simultaneous refreshes
      setTimeout(() => {
        const currentGet = get();
        if (currentGet.getConversations) {
          currentGet.getConversations();
        }
      }, 150);
    });

    socket.on("newGroupMessage", (newMessage) => {
      const { activeConversation, messages } = get();
      const isFromCurrent =
        activeConversation &&
        activeConversation.type === "group" &&
        newMessage.groupId === activeConversation.group._id;
      
      if (isFromCurrent) {
        set({ messages: [...messages, newMessage] });
      }
      
      // Debounced refresh to prevent multiple simultaneous refreshes
      setTimeout(() => {
        const currentGet = get();
        if (currentGet.getConversations) {
          currentGet.getConversations();
        }
      }, 150);
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("newGroupMessage");
  },

  toggleSelectionMode: () => {
    set((state) => ({
      isSelectionMode: !state.isSelectionMode,
      selectedMessages: new Set(),
      messageReadStatus: null,
    }));
  },

  toggleMessageSelection: (messageId) => {
    set((state) => {
      const newSelectedMessages = new Set(state.selectedMessages);
      if (newSelectedMessages.has(messageId)) {
        newSelectedMessages.delete(messageId);
      } else {
        newSelectedMessages.add(messageId);
      }
      return { selectedMessages: newSelectedMessages };
    });
  },

  clearSelection: () => {
    set({ selectedMessages: new Set(), isSelectionMode: false });
  },

  getMessageReadStatus: async (messageId) => {
    set({ isReadStatusLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/read-status/${messageId}`);
      set({ messageReadStatus: res.data });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to get message read status";
      toast.error(errorMessage);
      console.error("Get message read status error:", error);
    } finally {
      set({ isReadStatusLoading: false });
    }
  },

  deleteSelectedMessages: async () => {
    const { selectedMessages } = get();
    if (selectedMessages.size === 0) return;

    try {
      const res = await axiosInstance.delete("/messages/delete", {
        data: { messageIds: Array.from(selectedMessages) }
      });
      
      if (res.data.success) {
        // Remove deleted messages from the current messages
        set((state) => ({
          messages: state.messages.filter(msg => !selectedMessages.has(msg._id)),
          selectedMessages: new Set(),
          isSelectionMode: false,
        }));
        
        toast.success(`Deleted ${res.data.deletedCount} message(s)`);
        
        // Refresh conversations
        get().getConversations();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete messages";
      toast.error(errorMessage);
      console.error("Delete messages error:", error);
    }
  },

  clearMessageReadStatus: () => {
    set({ messageReadStatus: null });
  },
}));
