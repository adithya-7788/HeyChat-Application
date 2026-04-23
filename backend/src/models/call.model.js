import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
    },
    chatId: {
      type: String,
      required: true,
    },
    chatType: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["calling", "ringing", "connected", "rejected", "missed", "ended"],
          default: "ringing",
        },
        joinedAt: {
          type: Date,
        },
        leftAt: {
          type: Date,
        },
      },
    ],
    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["initiated", "ringing", "connected", "ended", "rejected", "missed"],
      default: "initiated",
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for faster queries
callSchema.index({ chatId: 1, createdAt: -1 });
callSchema.index({ initiator: 1 });
callSchema.index({ "participants.userId": 1 });

const Call = mongoose.model("Call", callSchema);

export default Call;
