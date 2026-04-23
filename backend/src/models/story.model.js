import mongoose from "mongoose";

const textOverlaySchema = new mongoose.Schema(
  {
    content: { type: String, default: "" },
    color: { type: String, default: "#FFFFFF" },
    font: { type: String, default: "sans" },
    x: { type: Number, default: 50 }, // percentage
    y: { type: Number, default: 80 }, // percentage
  },
  { _id: false }
);

const storySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], required: true },
    durationDays: { type: Number, enum: [1, 2, 3], default: 1 },
    expiresAt: { type: Date, required: true },
    textOverlay: { type: textOverlaySchema, default: () => ({}) },
    viewedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        seenAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model("Story", storySchema);
export default Story;
