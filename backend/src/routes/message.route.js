import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  markMessagesAsSeen,
  markGroupMessagesAsSeen,
  getUnreadSummary,
  getGroupMessages,
  sendGroupMessage,
  getConversations,
  getMessageReadStatus,
  deleteMessages,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/conversations", protectRoute, getConversations);
router.get("/group/:id", protectRoute, getGroupMessages);
router.get("/:id", protectRoute, getMessages);
router.post("/:id/seen", protectRoute, markMessagesAsSeen);
router.post("/group/:id/seen", protectRoute, markGroupMessagesAsSeen);
router.get("/unread-summary/all", protectRoute, getUnreadSummary);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/group/:id", protectRoute, sendGroupMessage);
router.get("/read-status/:messageId", protectRoute, getMessageReadStatus);
router.delete("/delete", protectRoute, deleteMessages);

export default router;
