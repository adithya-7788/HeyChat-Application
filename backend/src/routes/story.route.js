import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getStoriesFeed,
  getUserStories,
  createStory,
  markStorySeen,
  getUnopenedStoriesCount,
} from "../controllers/story.controller.js";

const router = express.Router();

router.get("/feed", protectRoute, getStoriesFeed);
router.get("/user/:id", protectRoute, getUserStories);
router.post("/", protectRoute, createStory);
router.post("/:id/seen", protectRoute, markStorySeen);
router.get("/unopened-count", protectRoute, getUnopenedStoriesCount);

export default router;
