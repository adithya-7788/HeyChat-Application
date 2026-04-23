import FriendRequest from "../models/friendRequest.model.js";
import User from "../models/user.model.js";

export const sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }

    // Check if users are already friends
    const sender = await User.findById(senderId);
    if (sender.friends.includes(receiverId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return res.status(400).json({ message: "Friend request already pending" });
      }
      if (existingRequest.status === "accepted") {
        return res.status(400).json({ message: "Already friends" });
      }
    }

    const friendRequest = new FriendRequest({
      senderId,
      receiverId,
      status: "pending",
    });

    await friendRequest.save();
    await friendRequest.populate("senderId", "fullName profilePic email");
    await friendRequest.populate("receiverId", "fullName profilePic email");

    res.status(201).json(friendRequest);
  } catch (error) {
    console.log("Error in sendFriendRequest:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Friend request already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({ message: "Friend request already processed" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // Add to friends list for both users
    await User.findByIdAndUpdate(friendRequest.senderId, {
      $addToSet: { friends: friendRequest.receiverId },
    });
    await User.findByIdAndUpdate(friendRequest.receiverId, {
      $addToSet: { friends: friendRequest.senderId },
    });

    await friendRequest.populate("senderId", "fullName profilePic email");
    await friendRequest.populate("receiverId", "fullName profilePic email");

    res.status(200).json(friendRequest);
  } catch (error) {
    console.log("Error in acceptFriendRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to reject this request" });
    }

    friendRequest.status = "rejected";
    await friendRequest.save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.log("Error in rejectFriendRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      status: "pending",
    })
      .populate("senderId", "fullName profilePic email")
      .populate("receiverId", "fullName profilePic email")
      .sort({ createdAt: -1 });

    // Separate sent and received requests
    const sentRequests = requests.filter(
      (req) => req.senderId && req.senderId._id.toString() === userId.toString()
    );
    const receivedRequests = requests.filter(
      (req) => req.receiverId && req.receiverId._id.toString() === userId.toString()
    );

    res.status(200).json({
      sent: sentRequests || [],
      received: receivedRequests || [],
    });
  } catch (error) {
    console.log("Error in getFriendRequests:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("friends", "fullName profilePic email");

    res.status(200).json(user.friends || []);
  } catch (error) {
    console.log("Error in getFriends:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
