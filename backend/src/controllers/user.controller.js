import User from "../models/user.model.js";

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user._id;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("-password")
      .limit(20);

    res.status(200).json(users);
  } catch (error) {
    console.log("Error in searchUsers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRandomUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    // Get user's friends and pending requests to exclude them
    const user = await User.findById(userId);
    const friendIds = user.friends || [];

    // Get pending friend requests
    const FriendRequest = (await import("../models/friendRequest.model.js")).default;
    const pendingRequests = await FriendRequest.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      status: "pending",
    });

    const excludedIds = [
      userId,
      ...friendIds,
      ...pendingRequests.map((req) =>
        req.senderId.toString() === userId.toString()
          ? req.receiverId.toString()
          : req.senderId.toString()
      ),
    ];

    // Get random users excluding friends and pending requests
    const users = await User.find({
      _id: { $nin: excludedIds },
    })
      .select("-password")
      .limit(limit * 2); // Get more to randomize

    // Shuffle and limit
    const shuffled = users.sort(() => 0.5 - Math.random());
    const randomUsers = shuffled.slice(0, limit);

    res.status(200).json(randomUsers);
  } catch (error) {
    console.log("Error in getRandomUsers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id: userId } = req.params;

    const user = await User.findById(userId).populate("friends", "fullName profilePic email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.friends || []);
  } catch (error) {
    console.log("Error in getUserFriends:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
