import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  muteChat,
  unmuteChat,
  deleteChat,
  blockUser,
  unblockUser,
  deleteGroupChat,
  muteGroup,
  unmuteGroup,
  deleteGroupChatMessages,
} from "../controllers/chat.controller.js";

const router = express.Router();

// Group-specific routes first (more specific)
router.post("/mute/group/:groupId", protectRoute, muteGroup);
router.post("/unmute/group/:groupId", protectRoute, unmuteGroup);
router.delete("/group/messages/:groupId", protectRoute, deleteGroupChatMessages);
router.delete("/group/:groupId", protectRoute, deleteGroupChat);

// User-specific routes
router.post("/mute/:userId", protectRoute, muteChat);
router.post("/unmute/:userId", protectRoute, unmuteChat);
router.delete("/:userId", protectRoute, deleteChat);
router.post("/block/:userId", protectRoute, blockUser);
router.post("/unblock/:userId", protectRoute, unblockUser);

export default router;
