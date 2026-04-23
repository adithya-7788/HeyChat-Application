import Call from "../models/call.model.js";
import User from "../models/user.model.js";
import Group from "../models/group.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Get call history for a chat
export const getCallHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const calls = await Call.find({ chatId })
      .sort({ createdAt: -1 })
      .populate("initiator", "fullName profilePic")
      .populate("participants.userId", "fullName profilePic");

    // For group calls include group name; map async to fetch group data when needed
    const formattedCalls = await Promise.all(
      calls.map(async (call) => {
        const participant = call.participants.find(
          (p) => p.userId._id.toString() === userId.toString()
        );
        const isInitiator = call.initiator._id.toString() === userId.toString();

        const base = {
          ...call.toObject(),
          userStatus: isInitiator ? "outgoing" : "incoming",
          participantStatus: participant?.status || "missed",
        };

        if (call.chatType === "group") {
          try {
            const group = await Group.findById(call.chatId).select("name profilePic");
            base.chatName = group ? group.name : null;
            base.chatGroup = group ? { name: group.name, profilePic: group.profilePic } : null;
          } catch (err) {
            base.chatName = null;
            base.chatGroup = null;
          }
        }

        return base;
      })
    );

    res.status(200).json(formattedCalls);
  } catch (error) {
    console.error("Error in getCallHistory: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all call history for the user
export const getAllCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    // Get all calls where user is a participant
    const calls = await Call.find({
      $or: [
        { initiator: userId },
        { "participants.userId": userId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("initiator", "fullName profilePic")
      .populate("participants.userId", "fullName profilePic")
      .limit(100);

    // Format calls and include group name for group calls
    const formattedCalls = await Promise.all(
      calls.map(async (call) => {
        const participant = call.participants.find(
          (p) => p.userId._id.toString() === userId.toString()
        );
        const isInitiator = call.initiator._id.toString() === userId.toString();

        const base = {
          ...call.toObject(),
          userStatus: isInitiator ? "outgoing" : "incoming",
          participantStatus: participant?.status || "missed",
        };

        if (call.chatType === "group") {
          try {
            const group = await Group.findById(call.chatId).select("name profilePic");
            base.chatName = group ? group.name : null;
            base.chatGroup = group ? { name: group.name, profilePic: group.profilePic } : null;
          } catch (err) {
            base.chatName = null;
            base.chatGroup = null;
          }
        }

        return base;
      })
    );

    res.status(200).json(formattedCalls);
  } catch (error) {
    console.error("Error in getAllCallHistory: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a call record (called when call is initiated)
export const createCall = async (req, res) => {
  try {
    const { chatId, chatType, callType, participantIds } = req.body;
    const initiatorId = req.user._id;

    // Generate unique call ID
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create participants array
    const participants = participantIds.map((userId) => ({
      userId,
      status: "ringing",
    }));

    // Add initiator as participant
    participants.push({
      userId: initiatorId,
      status: "connected",
      joinedAt: new Date(),
    });

    const call = new Call({
      callId,
      chatId,
      chatType,
      initiator: initiatorId,
      participants,
      callType,
      status: "ringing",
    });

    await call.save();

    // Populate for response
    await call.populate("initiator", "fullName profilePic");
    await call.populate("participants.userId", "fullName profilePic");

    res.status(201).json(call);
  } catch (error) {
    console.error("Error in createCall: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update call status (when call is accepted, rejected, or ended)
export const updateCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, participantStatus } = req.body;
    const userId = req.user._id;

    const call = await Call.findOne({ callId });
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    // Update participant status
    if (participantStatus) {
      const participant = call.participants.find(
        (p) => p.userId.toString() === userId.toString()
      );
      if (participant) {
        participant.status = participantStatus;
        if (participantStatus === "connected") {
          participant.joinedAt = new Date();
        } else if (participantStatus === "ended" || participantStatus === "rejected") {
          participant.leftAt = new Date();
        }
      }
    }

    // Update overall call status
    if (status) {
      call.status = status;
      if (status === "connected" && !call.startedAt) {
        call.startedAt = new Date();
      } else if (status === "ended" || status === "rejected" || status === "missed") {
        call.endedAt = new Date();
        if (call.startedAt) {
          call.duration = Math.floor((call.endedAt - call.startedAt) / 1000);
        }
      }
    }

    await call.save();
    await call.populate("initiator", "fullName profilePic");
    await call.populate("participants.userId", "fullName profilePic");

    res.status(200).json(call);
  } catch (error) {
    console.error("Error in updateCallStatus: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get call details
export const getCallDetails = async (req, res) => {
  try {
    const { callId } = req.params;

    const call = await Call.findOne({ callId })
      .populate("initiator", "fullName profilePic")
      .populate("participants.userId", "fullName profilePic");

    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    res.status(200).json(call);
  } catch (error) {
    console.error("Error in getCallDetails: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add participant to an existing call
export const addParticipantToCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { participantId } = req.body;
    const userId = req.user._id;

    const call = await Call.findOne({ callId });
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    // Check if call is still active
    if (call.status === "ended" || call.status === "missed" || call.status === "rejected") {
      return res.status(400).json({ error: "Call is no longer active" });
    }

    // Check if participant is already in the call
    const existingParticipant = call.participants.find(
      (p) => p.userId.toString() === participantId.toString()
    );
    if (existingParticipant) {
      return res.status(400).json({ error: "Participant is already in the call" });
    }

    // Add new participant
    call.participants.push({
      userId: participantId,
      status: "ringing",
    });

    await call.save();

    // Populate for response
    await call.populate("initiator", "fullName profilePic");
    await call.populate("participants.userId", "fullName profilePic");

    res.status(200).json(call);
  } catch (error) {
    console.error("Error in addParticipantToCall: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
