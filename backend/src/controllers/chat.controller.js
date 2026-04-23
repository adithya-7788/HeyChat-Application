import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import { io } from "../lib/socket.js";

export const muteChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const user = await User.findById(myId);
    if (!user.mutedChats.includes(userId)) {
      user.mutedChats.push(userId);
      await user.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in muteChat:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unmuteChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const user = await User.findById(myId);
    user.mutedChats = user.mutedChats.filter(
      (id) => id.toString() !== userId.toString()
    );
    await user.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in unmuteChat:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    // Delete all messages between the two users
    await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: userId },
        { senderId: userId, receiverId: myId },
      ],
    });

    // Notify the other user via socket
    const { getReceiverSocketId } = await import("../lib/socket.js");
    const receiverSocketId = getReceiverSocketId(userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("chatDeleted", { deletedBy: myId });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in deleteChat:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    if (myId.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    const user = await User.findById(myId);
    if (!user.blockedUsers.includes(userId)) {
      user.blockedUsers.push(userId);
      await user.save();
    }

    // Remove from friends if they are friends
    user.friends = user.friends.filter(
      (id) => id.toString() !== userId.toString()
    );
    await user.save();

    // Also remove from the blocked user's friends
    const blockedUser = await User.findById(userId);
    blockedUser.friends = blockedUser.friends.filter(
      (id) => id.toString() !== myId.toString()
    );
    await blockedUser.save();

    // Notify via socket
    const { getReceiverSocketId } = await import("../lib/socket.js");
    const receiverSocketId = getReceiverSocketId(userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userBlocked", { blockedBy: myId });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in blockUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const user = await User.findById(myId);
    user.blockedUsers = user.blockedUsers.filter(
      (id) => id.toString() !== userId.toString()
    );
    await user.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in unblockUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const muteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const myId = req.user._id;
    
    console.log("Mute group request:", { groupId, myId });

    if (!groupId) {
      return res.status(400).json({ message: "Group ID is required" });
    }

    const mutedGroupId = `group_${groupId}`;
    console.log("Muted group ID:", mutedGroupId);

    const user = await User.findById(myId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.mutedChats.includes(mutedGroupId)) {
      user.mutedChats.push(mutedGroupId);
      await user.save();
      console.log("Group muted successfully");
    } else {
      console.log("Group already muted");
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in muteGroup:", error.message);
    console.error("Full error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unmuteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const myId = req.user._id;
    const mutedGroupId = `group_${groupId}`;
    
    console.log("Unmute group request:", { groupId, myId, mutedGroupId });

    const user = await User.findById(myId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const originalLength = user.mutedChats.length;
    user.mutedChats = user.mutedChats.filter(
      (id) => id.toString() !== mutedGroupId.toString()
    );
    const newLength = user.mutedChats.length;
    
    console.log("Muted chats before:", originalLength, "after:", newLength);
    
    await user.save();
    console.log("Group unmuted successfully");

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in unmuteGroup:", error.message);
    console.error("Full error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroupChatMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member of the group
    if (!group.members.some((m) => m.toString() === myId.toString())) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Delete ALL messages in this group for this user (both sent and received)
    await Message.deleteMany({
      groupId,
      $or: [
        { senderId: myId },
        { receiverId: myId }
      ]
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in deleteGroupChatMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroupChat = async (req, res) => {
  try {
    const { groupId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only admin can delete group
    if (group.admin.toString() !== myId.toString()) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    // Delete all group messages
    await Message.deleteMany({ groupId });

    // Delete the group
    await group.deleteOne();

    // Notify all members via socket
    const { getReceiverSocketId } = await import("../lib/socket.js");
    group.members.forEach((memberId) => {
      const socketId = getReceiverSocketId(memberId.toString());
      if (socketId) {
        io.to(socketId).emit("groupDeleted", { groupId });
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in deleteGroupChat:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
