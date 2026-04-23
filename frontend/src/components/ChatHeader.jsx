import { PhoneCall, Video, X, CheckSquare, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import Avatar from "./Avatar";

const ChatHeader = ({ onBack }) => {
  const { activeConversation, closeConversation, openProfileView, toggleSelectionMode } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { initiateCall } = useCallStore();

  if (!activeConversation) return null;

  const isGroup = activeConversation.type === "group";
  const title = isGroup ? activeConversation.group.name : activeConversation.user.fullName;
  const isOnline =
    !isGroup && onlineUsers.includes(activeConversation.user._id);

  const handleCall = async (callType) => {
    if (!activeConversation) return;

    let chatId;
    let participantIds = [];

    if (isGroup) {
      chatId = activeConversation.group._id;
      // Get all group members except current user
      const members = activeConversation.group.members || [];
      participantIds = members
        .map((member) => (typeof member === "object" ? member._id : member))
        .filter((id) => id !== authUser._id);
    } else {
      chatId = activeConversation.user._id;
      participantIds = [activeConversation.user._id];
    }

    if (participantIds.length === 0) {
      return;
    }

    await initiateCall(chatId, isGroup ? "group" : "direct", callType, participantIds);
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center gap-2">
        {/* Mobile: back button on the left */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden btn btn-ghost btn-xs p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Avatar and name section */}
        <button
          type="button"
          className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden"
          onClick={openProfileView}
        >
          <div className="avatar flex-shrink-0">
            <div className="size-10 rounded-full relative">
              {isGroup ? (
                <Avatar isGroup={true} group={activeConversation.group} size={40} />
              ) : (
                <Avatar user={activeConversation.user} size={40} />
              )}
            </div>
          </div>

          <div className="text-left min-w-0 flex-1 overflow-hidden">
            <h3 className="font-medium truncate">{title}</h3>
            {!isGroup && (
              <p className="text-sm text-base-content/70 truncate">
                {isOnline ? "Online" : "Offline"}
              </p>
            )}
          </div>
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Mobile: show select, video and audio call buttons */}
          <button
            type="button"
            onClick={toggleSelectionMode}
            className="md:hidden btn btn-ghost btn-xs p-2"
            title="Select messages"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleCall("video")}
            className="md:hidden btn btn-ghost btn-xs p-2"
            title="Video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleCall("audio")}
            className="md:hidden btn btn-ghost btn-xs p-2"
            title="Audio call"
          >
            <PhoneCall className="w-5 h-5" />
          </button>

          {/* Desktop: show all action buttons */}
          <button
            type="button"
            onClick={toggleSelectionMode}
            className="hidden md:flex btn btn-ghost btn-xs"
            title="Select messages"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleCall("audio")}
            className="hidden md:flex btn btn-ghost btn-xs"
            title="Audio call"
          >
            <PhoneCall className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleCall("video")}
            className="hidden md:flex btn btn-ghost btn-xs"
            title="Video call"
          >
            <Video className="w-4 h-4" />
          </button>
          <button 
            type="button" 
            onClick={closeConversation} 
            title="Close chat"
            className="hidden md:flex"
          >
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
