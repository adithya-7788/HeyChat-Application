import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const user = await User.findById(loggedInUserId).populate("friends", "fullName profilePic email");

    res.status(200).json(user.friends || []);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, video } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    let videoUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    if (video) {
      const uploadResponse = await cloudinary.uploader.upload(video, {
        resource_type: "video",
      });
      videoUrl = uploadResponse.secure_url;
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    const initialStatus = receiverSocketId ? "delivered" : "sent";

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
      chatType: "direct",
      groupId: null,
      status: initialStatus,
      seen: false,
    });

    await newMessage.save();

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.members.some((m) => m.toString() === myId.toString())) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const messages = await Message.find({
      chatType: "group",
      groupId,
    })
      .populate("senderId", "fullName profilePic email")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image, video } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.members.some((m) => m.toString() === senderId.toString())) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    let imageUrl;
    let videoUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    if (video) {
      const uploadResponse = await cloudinary.uploader.upload(video, {
        resource_type: "video",
      });
      videoUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId: null,
      text,
      image: imageUrl,
      video: videoUrl,
      chatType: "group",
      groupId,
      status: "sent",
      seen: false,
    });

    await newMessage.save();
    await newMessage.populate("senderId", "fullName profilePic email");

    io.to(groupId.toString()).emit("newGroupMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsSeen = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      senderId: otherUserId,
      receiverId: myId,
      seen: false,
      chatType: "direct",
    });

    // Update each message to track read status
    await Promise.all(
      messages.map(async (message) => {
        // Check if user already marked as read
        const alreadyRead = message.readBy.some(
          (read) => read.userId.toString() === myId.toString()
        );

        if (!alreadyRead) {
          message.readBy.push({ userId: myId, readAt: new Date() });
          message.seen = true;
          message.seenAt = new Date();
          message.status = "seen";
          await message.save();
        }
      })
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in markMessagesAsSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markGroupMessagesAsSeen = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const myId = req.user._id;

    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.members.some((m) => m.toString() === myId.toString())) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Mark all group messages as read for this user (per-user read tracking)
    const messages = await Message.find({
      groupId,
      chatType: "group",
      senderId: { $ne: myId },
      $or: [
        { "readBy.userId": { $ne: myId } },
        { readBy: { $exists: false } }
      ]
    });

    // Update each message to track read status
    await Promise.all(
      messages.map(async (message) => {
        // Check if user already marked as read
        const alreadyRead = message.readBy.some(
          (read) => read.userId.toString() === myId.toString()
        );

        if (!alreadyRead) {
          message.readBy.push({ userId: myId, readAt: new Date() });
          await message.save();
        }
      })
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in markGroupMessagesAsSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUnreadSummary = async (req, res) => {
  try {
    const myId = req.user._id;

    // Get unread direct messages
    const directSummary = await Message.aggregate([
      {
        $match: {
          receiverId: myId,
          seen: false,
          chatType: "direct",
        },
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get unread group messages for the user (messages not read by this user)
    const groupSummary = await Message.aggregate([
      {
        $match: {
          chatType: "group",
          senderId: { $ne: myId },
        },
      },
      {
        $lookup: {
          from: "groups",
          localField: "groupId",
          foreignField: "_id",
          as: "group",
        },
      },
      { $unwind: "$group" },
      {
        $match: {
          "group.members": myId,
          $or: [
            { readBy: { $exists: false } },
            { "readBy.userId": { $ne: myId } }
          ],
        },
      },
      {
        $group: {
          _id: "$groupId",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {};
    directSummary.forEach((item) => {
      result[item._id.toString()] = item.count;
    });
    groupSummary.forEach((item) => {
      result[`group_${item._id.toString()}`] = item.count;
    });

    res.status(200).json(result);
  } catch (error) {
    console.log("Error in getUnreadSummary controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessageReadStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const myId = req.user._id;

    const message = await Message.findById(messageId)
      .populate("readBy.userId", "fullName profilePic email")
      .populate("senderId", "fullName profilePic email");

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user has access to this message
    if (message.chatType === "direct") {
      if (message.senderId.toString() !== myId.toString() && 
          message.receiverId.toString() !== myId.toString()) {
        return res.status(403).json({ error: "Not authorized to view this message" });
      }
    } else if (message.chatType === "group") {
      const group = await Group.findById(message.groupId);
      if (!group || !group.members.some((m) => m.toString() === myId.toString())) {
        return res.status(403).json({ error: "Not authorized to view this message" });
      }
    }

    let allUsers = [];
    
    if (message.chatType === "direct") {
      // For direct messages, only show sender and receiver
      allUsers = [message.senderId, await User.findById(message.receiverId).select("fullName profilePic email")];
    } else if (message.chatType === "group") {
      // For group messages, show all group members
      const group = await Group.findById(message.groupId).populate("members", "fullName profilePic email");
      allUsers = group.members;
    }

    const readUsers = message.readBy.map(read => read.userId);
    const unreadUsers = allUsers.filter(user => 
      !readUsers.some(readUser => readUser._id.toString() === user._id.toString()) &&
      user._id.toString() !== message.senderId._id.toString()
    );

    res.status(200).json({
      message,
      readBy: message.readBy,
      readUsers,
      unreadUsers
    });
  } catch (error) {
    console.log("Error in getMessageReadStatus controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessages = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const myId = req.user._id;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "Message IDs are required" });
    }

    // Delete messages where user is either sender or receiver
    const result = await Message.deleteMany({
      _id: { $in: messageIds },
      $or: [
        { senderId: myId },
        { receiverId: myId }
      ]
    });

    res.status(200).json({ 
      success: true, 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.log("Error in deleteMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const myId = req.user._id;

    // Get all direct conversations with latest message
    const directConversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: myId, chatType: "direct" },
            { receiverId: myId, chatType: "direct" },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", myId] },
              "$receiverId",
              "$senderId",
            ],
          },
          latestMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          type: "direct",
          user: {
            _id: "$user._id",
            fullName: "$user.fullName",
            profilePic: "$user.profilePic",
            email: "$user.email",
          },
          latestMessage: {
            _id: "$latestMessage._id",
            text: "$latestMessage.text",
            createdAt: "$latestMessage.createdAt",
            senderId: "$latestMessage.senderId",
          },
          lastActivity: "$latestMessage.createdAt",
        },
      },
    ]);

    // Get all groups user is in with latest message
    const groups = await Group.find({ members: myId })
      .populate("members", "fullName profilePic email")
      .populate("admin", "fullName profilePic email");

    const groupConversations = await Promise.all(
      groups.map(async (group) => {
        const latestMessage = await Message.findOne({
          chatType: "group",
          groupId: group._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        return {
          type: "group",
          group: {
            _id: group._id,
            name: group.name,
            members: group.members,
            admin: group.admin,
          },
          latestMessage: latestMessage
            ? {
                _id: latestMessage._id,
                text: latestMessage.text,
                createdAt: latestMessage.createdAt,
                senderId: latestMessage.senderId,
              }
            : null,
          lastActivity: latestMessage ? latestMessage.createdAt : group.createdAt,
        };
      })
    );

    // Combine and sort by lastActivity
    const allConversations = [...directConversations, ...groupConversations].sort(
      (a, b) => {
        const timeA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        const timeB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
        return timeB - timeA;
      }
    );

    res.status(200).json(allConversations);
  } catch (error) {
    console.log("Error in getConversations controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
