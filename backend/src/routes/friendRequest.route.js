import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getFriends,
} from "../controllers/friendRequest.controller.js";

const router = express.Router();

router.post("/send", protectRoute, sendFriendRequest);
router.post("/accept/:requestId", protectRoute, acceptFriendRequest);
router.post("/reject/:requestId", protectRoute, rejectFriendRequest);
router.get("/", protectRoute, getFriendRequests);
router.get("/friends", protectRoute, getFriends);

export default router;
