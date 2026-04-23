import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getMyGroups,
  addGroupMembers,
  deleteGroup,
  removeGroupMember,
  exitGroup,
  updateGroupProfile,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/", protectRoute, createGroup);
router.get("/", protectRoute, getMyGroups);
router.post("/:id/members", protectRoute, addGroupMembers);
router.delete("/:id/members/:memberId", protectRoute, removeGroupMember);
router.post("/:id/exit", protectRoute, exitGroup);
router.put("/:id/profile", protectRoute, updateGroupProfile);
router.delete("/:id", protectRoute, deleteGroup);

export default router;

