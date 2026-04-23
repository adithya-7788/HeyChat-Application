import Story from "../models/story.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

// Helper to build expiry date
function computeExpiry(days = 1) {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(1, Math.min(3, days)));
  return d;
}

export const getStoriesFeed = async (req, res) => {
  try {
    const myId = req.user._id;
    const me = await User.findById(myId).populate("friends", "fullName profilePic");
    const friendIds = (me.friends || []).map((f) => f._id);

    const owners = [myId, ...friendIds];

    const stories = await Story.find({
      userId: { $in: owners },
      expiresAt: { $gt: new Date() },
    })
      .populate("userId", "fullName profilePic")
      .sort({ createdAt: -1 });

    // Group by owner
    const grouped = {};
    stories.forEach((s) => {
      const ownerId = s.userId._id.toString();
      if (!grouped[ownerId]) {
        grouped[ownerId] = {
          owner: s.userId,
          stories: [],
          hasUnopened: false,
          latest: s, // first is latest due to sort
        };
      }
      const seen = s.viewedBy.some((v) => v.userId.toString() === myId.toString());
      grouped[ownerId].stories.push({ ...s.toObject(), seen });
      if (!seen) grouped[ownerId].hasUnopened = true;
    });

    // Build array and sort as requested: unopened above opened, both by latest upload time
    const result = Object.values(grouped).sort((a, b) => {
      if (a.hasUnopened !== b.hasUnopened) return a.hasUnopened ? -1 : 1;
      return new Date(b.latest.createdAt) - new Date(a.latest.createdAt);
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getStoriesFeed:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserStories = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user._id;

    const stories = await Story.find({
      userId: id,
      expiresAt: { $gt: new Date() },
    })
      .populate("userId", "fullName profilePic")
      .sort({ createdAt: 1 });

    const data = stories.map((s) => ({
      ...s.toObject(),
      seen: s.viewedBy.some((v) => v.userId.toString() === myId.toString()),
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in getUserStories:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createStory = async (req, res) => {
  try {
    const { media, mediaType, durationDays = 1, textOverlay } = req.body;
    const userId = req.user._id;

    if (!media || !mediaType) {
      return res.status(400).json({ message: "Media and type are required" });
    }

    let uploadResponse;
    if (mediaType === "image") {
      uploadResponse = await cloudinary.uploader.upload(media);
    } else if (mediaType === "video") {
      uploadResponse = await cloudinary.uploader.upload(media, {
        resource_type: "video",
        eager: [{ duration: 30 }], // trim to 30s if longer
      });
    } else {
      return res.status(400).json({ message: "Invalid media type" });
    }

    const story = new Story({
      userId,
      mediaUrl: uploadResponse.secure_url,
      mediaType,
      durationDays: Math.max(1, Math.min(3, durationDays)),
      expiresAt: computeExpiry(durationDays),
      textOverlay: textOverlay || {},
    });

    await story.save();
    await story.populate("userId", "fullName profilePic");

    res.status(201).json(story);
  } catch (error) {
    console.error("Error in createStory:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markStorySeen = async (req, res) => {
  try {
    const { id } = req.params; // story id
    const userId = req.user._id;

    const story = await Story.findById(id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    const already = story.viewedBy.some((v) => v.userId.toString() === userId.toString());
    if (!already) {
      story.viewedBy.push({ userId, seenAt: new Date() });
      await story.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in markStorySeen:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUnopenedStoriesCount = async (req, res) => {
  try {
    const myId = req.user._id;
    const me = await User.findById(myId).populate("friends", "_id");
    const friendIds = (me.friends || []).map((f) => f._id);

    const stories = await Story.aggregate([
      { $match: { userId: { $in: friendIds }, expiresAt: { $gt: new Date() } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$userId",
          stories: { $push: "$$ROOT" },
        },
      },
    ]);

    let count = 0;
    for (const group of stories) {
      const hasUnopened = (group.stories || []).some(
        (s) => !s.viewedBy?.some((v) => v.userId.toString() === myId.toString())
      );
      if (hasUnopened) count += 1;
    }

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error in getUnopenedStoriesCount:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
