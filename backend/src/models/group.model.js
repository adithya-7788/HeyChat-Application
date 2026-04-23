import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    profilePic: {
      type: String,
      default: "",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    isGroup: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Ensure admin is always a member
groupSchema.pre("save", function (next) {
  if (this.admin && !this.members.includes(this.admin)) {
    this.members.push(this.admin);
  }
  next();
});

// Ensure admin is included in members on creation
groupSchema.pre("validate", function (next) {
  if (this.admin && !this.members.includes(this.admin)) {
    this.members.push(this.admin);
  }
  next();
});

const Group = mongoose.model("Group", groupSchema);

export default Group;

