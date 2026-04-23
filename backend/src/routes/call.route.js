import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getCallHistory,
  getAllCallHistory,
  createCall,
  updateCallStatus,
  getCallDetails,
  addParticipantToCall,
} from "../controllers/call.controller.js";

const router = express.Router();

router.get("/history/all", protectRoute, getAllCallHistory);
router.get("/history/:chatId", protectRoute, getCallHistory);
router.get("/:callId", protectRoute, getCallDetails);
router.post("/", protectRoute, createCall);
router.post("/:callId/add-participant", protectRoute, addParticipantToCall);
router.patch("/:callId/status", protectRoute, updateCallStatus);

export default router;
