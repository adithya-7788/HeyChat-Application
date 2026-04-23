import Group from "../models/group.model.js";
import cloudinary from "../lib/cloudinary.js";

export const createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const adminId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "At least one member is required" });
    }

    const uniqueMembers = [...new Set(memberIds.map((id) => id.toString()))];
    
    // Ensure admin is included in members
    if (!uniqueMembers.includes(adminId.toString())) {
      uniqueMembers.push(adminId.toString());
    }

    const group = new Group({
      name: name.trim(),
      admin: adminId,
      members: uniqueMembers,
    });

    await group.save();
    await group.populate("members", "fullName profilePic email");
    await group.populate("admin", "fullName profilePic email");

    res.status(201).json(group);
  } catch (error) {
    console.error("Error in createGroup:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const myId = req.user._id;

    const groups = await Group.find({ members: myId })
      .populate("members", "fullName profilePic email")
      .populate("admin", "fullName profilePic email");

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getMyGroups:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "No members provided" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Any member can add friends
    if (!group.members.some((m) => m.toString() === userId.toString())) {
      return res.status(403).json({ message: "Only group members can add new members" });
    }

    const existingMemberIds = group.members.map((m) => m.toString());
    const newMembers = memberIds.filter((id) => !existingMemberIds.includes(id.toString()));

    group.members.push(...newMembers);
    await group.save();

    await group.populate("members", "fullName profilePic email");
    await group.populate("admin", "fullName profilePic email");

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in addGroupMembers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the admin can delete the group" });
    }

    await group.deleteOne();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in deleteGroup:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const { id: groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member
    if (!group.members.some((m) => m.toString() === userId.toString())) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Check if trying to remove admin
    if (group.admin.toString() === memberId) {
      return res.status(403).json({ message: "Cannot remove admin from group" });
    }

    // Only admin can remove members
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    // Remove member
    group.members = group.members.filter((m) => m.toString() !== memberId);
    await group.save();

    await group.populate("members", "fullName profilePic email");
    await group.populate("admin", "fullName profilePic email");

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in removeGroupMember:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const exitGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member
    if (!group.members.some((m) => m.toString() === userId.toString())) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const isAdmin = group.admin.toString() === userId.toString();
    const remainingMembers = group.members.filter((m) => m.toString() !== userId.toString());

    // If admin is leaving, transfer admin to oldest member
    if (isAdmin && remainingMembers.length > 0) {
      // Get all members with their join dates (using createdAt as proxy)
      // Since we don't track join dates, we'll use the order in members array
      // The first member (after admin) is considered oldest
      // If multiple members joined at creation, pick random
      const oldestMembers = remainingMembers.slice(0, 1); // Get first remaining member
      const newAdmin = oldestMembers[0];
      group.admin = newAdmin;
    }

    // Remove user from members
    group.members = remainingMembers;
    await group.save();

    // If no members left, delete the group
    if (group.members.length === 0) {
      await group.deleteOne();
      return res.status(200).json({ success: true, deleted: true });
    }

    await group.populate("members", "fullName profilePic email");
    await group.populate("admin", "fullName profilePic email");

    res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("Error in exitGroup:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGroupProfile = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the admin can update group profile" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    group.profilePic = uploadResponse.secure_url;
    await group.save();

    await group.populate("members", "fullName profilePic email");
    await group.populate("admin", "fullName profilePic email");

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in updateGroupProfile:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
