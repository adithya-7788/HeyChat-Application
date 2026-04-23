import { PhoneCall, Video, BellOff, Bell, Trash2, Ban, ArrowLeft, UserPlus, Search, X, LogOut, Camera } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import { useCallStore } from "../store/useCallStore";
import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import Avatar from "./Avatar";

const ProfileViewPanel = ({ conversation, onBack }) => {
  const { authUser, checkAuth } = useAuthStore();
  const { closeConversation, getConversations } = useChatStore();
  const { friends, getFriends } = useFriendStore();
  const { initiateCall } = useCallStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isUploadingGroupPhoto, setIsUploadingGroupPhoto] = useState(false);
  const [tempGroupPic, setTempGroupPic] = useState("");

  const isGroup = conversation.type === "group";
  const title = isGroup ? conversation.group.name : conversation.user.fullName;
  const isGroupAdmin = isGroup && (conversation.group.admin?._id === authUser?._id || conversation.group.admin === authUser?._id);

  useEffect(() => {
    // Check if chat is muted or user is blocked
    if (authUser) {
      if (isGroup) {
        setIsMuted(authUser.mutedChats?.includes(`group_${conversation.group._id}`) || false);
      } else {
        setIsMuted(authUser.mutedChats?.includes(conversation.user._id) || false);
        setIsBlocked(authUser.blockedUsers?.includes(conversation.user._id) || false);
      }
    }
    
    // Load group members
    if (isGroup) {
      setGroupMembers(conversation.group.members || []);
      getFriends();
    }
    
    // Reset add member state when conversation changes
    setIsAddingMember(false);
    setSelectedMembers([]);
    setMemberSearch("");
  }, [conversation, authUser, isGroup, getFriends]);

  const handleMuteToggle = async () => {
    try {
      const endpoint = isGroup 
        ? `/chat/mute/group/${conversation.group._id}`
        : `/chat/mute/${conversation.user._id}`;
      
      if (isMuted) {
        const unmuteEndpoint = isGroup 
          ? `/chat/unmute/group/${conversation.group._id}`
          : `/chat/unmute/${conversation.user._id}`;
        await axiosInstance.post(unmuteEndpoint);
        setIsMuted(false);
        toast.success(`${isGroup ? "Group" : "Chat"} unmuted`);
      } else {
        await axiosInstance.post(endpoint);
        setIsMuted(true);
        toast.success(`${isGroup ? "Group" : "Chat"} muted`);
      }
      // Refresh auth user to get updated mutedChats
      await checkAuth();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle mute");
    }
  };

  const handleDeleteChat = async () => {
    if (!confirm(isGroup ? "Delete all messages in this group? This will remove the group from your chat list." : "Delete all messages with this user?")) {
      return;
    }

    try {
      if (isGroup) {
        await axiosInstance.delete(`/chat/group/messages/${conversation.group._id}`);
        toast.success("Group chat deleted");
      } else {
        await axiosInstance.delete(`/chat/${conversation.user._id}`);
        toast.success("Chat deleted");
      }
      closeConversation();
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete chat");
    }
  };

  const handleBlockUser = async () => {
    if (!confirm(`Block ${conversation.user.fullName}? You won't be able to message them.`)) {
      return;
    }

    try {
      await axiosInstance.post(`/chat/block/${conversation.user._id}`);
      setIsBlocked(true);
      toast.success("User blocked");
      // Refresh auth user to get updated blockedUsers
      await checkAuth();
      closeConversation();
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block user");
    }
  };

  const handleUnblockUser = async () => {
    try {
      await axiosInstance.post(`/chat/unblock/${conversation.user._id}`);
      setIsBlocked(false);
      toast.success("User unblocked");
      // Refresh auth user to get updated blockedUsers
      await checkAuth();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unblock user");
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) return;

    try {
      const res = await axiosInstance.post(`/groups/${conversation.group._id}/members`, {
        memberIds: selectedMembers,
      });
      setGroupMembers(res.data.members || []);
      setSelectedMembers([]);
      setIsAddingMember(false);
      setMemberSearch("");
      toast.success("Members added successfully");
      // Refresh conversations to update group info
      await getConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add members");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Are you sure you want to remove this member from the group?")) {
      return;
    }

    try {
      const res = await axiosInstance.delete(
        `/groups/${conversation.group._id}/members/${memberId}`
      );
      setGroupMembers(res.data.members || []);
      toast.success("Member removed successfully");
      // Refresh conversations to update group info
      await getConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleExitGroup = async () => {
    if (!confirm("Are you sure you want to exit this group?")) {
      return;
    }

    try {
      await axiosInstance.post(`/groups/${conversation.group._id}/exit`);
      toast.success("You have left the group");
      closeConversation();
      onBack();
      // Refresh conversations
      await getConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to exit group");
    }
  };

  const toggleMemberSelection = (friendId) => {
    setSelectedMembers((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const isMemberInGroup = (friendId) => {
    return groupMembers.some((member) => {
      const memberId = typeof member === "object" ? member._id : member;
      return memberId === friendId || memberId?.toString() === friendId?.toString();
    });
  };

  const normalizedMemberSearch = memberSearch.trim().toLowerCase();
  const filteredFriends = friends
    .filter((friend) => {
      if (isMemberInGroup(friend._id)) return false;
      if (!normalizedMemberSearch) return true;
      const name = friend.fullName?.toLowerCase() || "";
      const email = friend.email?.toLowerCase() || "";
      return name.includes(normalizedMemberSearch) || email.includes(normalizedMemberSearch);
    })
    .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

  const handleCall = async (callType) => {
    if (!conversation) return;

    let chatId;
    let participantIds = [];

    if (isGroup) {
      chatId = conversation.group._id;
      // Get all group members except current user
      const members = conversation.group.members || [];
      participantIds = members
        .map((member) => (typeof member === "object" ? member._id : member))
        .filter((id) => id !== authUser._id);
    } else {
      chatId = conversation.user._id;
      participantIds = [conversation.user._id];
    }

    if (participantIds.length === 0) {
      toast.error("No participants available for the call");
      return;
    }

    await initiateCall(chatId, isGroup ? "group" : "direct", callType, participantIds);
  };

  return (
    <div className="flex-1 flex flex-col bg-base-100">
      <div className="px-4 py-3 border-b border-base-300 flex items-center gap-2">
        <button className="btn btn-ghost btn-xs p-1" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-semibold">
          {isGroup ? "Group info" : "Contact info"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="avatar">
              <div className="size-20 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
                {isGroup ? (
                  <Avatar isGroup={true} group={{...conversation.group, profilePic: tempGroupPic || conversation.group.profilePic }} size={80} />
                ) : (
                  <Avatar user={conversation.user} size={80} />
                )}
              </div>
            </div>
            {isGroup && isGroupAdmin && (
              <label
                htmlFor="group-avatar-upload"
                className={`absolute bottom-0 right-0 bg-base-content p-2 rounded-full cursor-pointer ${isUploadingGroupPhoto ? "animate-pulse pointer-events-none" : ""}`}
                title="Change group photo"
              >
                <Camera className="w-4 h-4 text-base-200" />
                <input
                  id="group-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        setIsUploadingGroupPhoto(true);
                        const base64 = reader.result;
                        setTempGroupPic(base64);
                        const res = await axiosInstance.put(`/groups/${conversation.group._id}/profile`, { profilePic: base64 });
                        // Update local conversation object minimally
                        conversation.group.profilePic = res.data.profilePic;
                        toast.success("Group photo updated");
                        // refresh conversations to reflect change in list
                        getConversations();
                      } catch (err) {
                        toast.error(err.response?.data?.message || "Failed to update group photo");
                      } finally {
                        setIsUploadingGroupPhoto(false);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-xs text-base-content/60 mt-1">
              {isGroup
                ? `${conversation.group.members?.length || 0} members`
                : authUser?.email}
            </p>
          </div>
        </div>

        {/* Call Buttons */}
        <div className="flex gap-3">
          <button 
            className="btn btn-sm flex-1 gap-2"
            onClick={() => handleCall("audio")}
          >
            <PhoneCall className="w-4 h-4" />
            <span>Audio call</span>
          </button>
          <button 
            className="btn btn-sm flex-1 gap-2"
            onClick={() => handleCall("video")}
          >
            <Video className="w-4 h-4" />
            <span>Video call</span>
          </button>
        </div>

        {/* Group Members Section */}
        {isGroup && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Members ({groupMembers.length})</h4>
              <button
                className="btn btn-xs btn-primary gap-1"
                onClick={() => setIsAddingMember(!isAddingMember)}
              >
                <UserPlus className="w-3 h-3" />
                Add member
              </button>
            </div>
            
            {!isAddingMember ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groupMembers.map((member) => {
                  const memberId = typeof member === "object" ? member._id : member;
                  const memberName = typeof member === "object" ? member.fullName : "Unknown";
                  const memberPic = typeof member === "object" ? member.profilePic : null;
                  const isAdmin = conversation.group.admin?._id === memberId || conversation.group.admin === memberId;
                  const isCurrentUser = memberId === authUser?._id;
                  const canRemove = !isAdmin && (conversation.group.admin?._id === authUser?._id || conversation.group.admin === authUser?._id);
                  
                  return (
                    <div key={memberId} className="flex items-center gap-3 p-2 rounded-lg bg-base-200">
                      <Avatar 
                        user={typeof member === "object" ? member : { fullName: memberName, profilePic: memberPic }} 
                        size={32} 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {memberName}
                          {isCurrentUser && <span className="text-xs text-primary ml-2">(You)</span>}
                        </div>
                        {isAdmin && (
                          <div className="text-xs text-primary">Admin</div>
                        )}
                      </div>
                      {canRemove && (
                        <button
                          onClick={() => handleRemoveMember(memberId)}
                          className="btn btn-xs btn-ghost btn-error"
                          title="Remove member"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="input input-sm input-bordered w-full pl-8"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-base-300 rounded-lg p-2">
                  {filteredFriends.length === 0 ? (
                    <div className="text-center text-xs text-base-content/60 py-4">
                      No friends available to add
                    </div>
                  ) : (
                    filteredFriends.map((friend) => {
                      const isSelected = selectedMembers.includes(friend._id);
                      return (
                        <button
                          key={friend._id}
                          type="button"
                          onClick={() => toggleMemberSelection(friend._id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-base-200 rounded ${
                            isSelected ? "bg-base-200" : ""
                          }`}
                        >
                          <span className="inline-flex items-center justify-center size-4 rounded border border-base-300">
                            {isSelected && <span className="w-2 h-2 rounded bg-primary" />}
                          </span>
                          <Avatar user={friend} size={24} />
                          <span className="truncate flex-1">{friend.fullName}</span>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-primary flex-1"
                    onClick={handleAddMembers}
                    disabled={selectedMembers.length === 0}
                  >
                    Add Selected ({selectedMembers.length})
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setIsAddingMember(false);
                      setSelectedMembers([]);
                      setMemberSearch("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            className="btn btn-sm w-full justify-start gap-3"
            onClick={handleMuteToggle}
          >
            {isMuted ? (
              <>
                <Bell className="w-4 h-4" />
                <span>Unmute {isGroup ? "group" : "chat"}</span>
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4" />
                <span>Mute {isGroup ? "group" : "chat"}</span>
              </>
            )}
          </button>
          {isGroup && (
            <button
              className="btn btn-sm w-full justify-start gap-3 btn-outline btn-warning"
              onClick={handleExitGroup}
            >
              <LogOut className="w-4 h-4" />
              <span>Exit group</span>
            </button>
          )}
          <button
            className="btn btn-sm w-full justify-start gap-3 btn-outline btn-error"
            onClick={handleDeleteChat}
          >
            <Trash2 className="w-4 h-4" />
            <span>{isGroup ? "Delete chat" : "Delete chat"}</span>
          </button>
          {!isGroup && (
            <button
              className="btn btn-sm w-full justify-start gap-3 btn-outline btn-error"
              onClick={isBlocked ? handleUnblockUser : handleBlockUser}
            >
              <Ban className="w-4 h-4" />
              <span>{isBlocked ? "Unblock user" : "Block user"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileViewPanel;

