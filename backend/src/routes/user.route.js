import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { searchUsers, getRandomUsers, getUserFriends } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.get("/explore", protectRoute, getRandomUsers);
router.get("/:id/friends", protectRoute, getUserFriends);

export default router;
