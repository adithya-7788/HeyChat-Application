import { Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";

const CallNotification = () => {
  const { incomingCall, acceptCall, rejectCall } = useCallStore();
  const { authUser } = useAuthStore();
  const { conversations } = useChatStore();
  const [initiatorInfo, setInitiatorInfo] = useState(null);

  useEffect(() => {
    if (incomingCall && incomingCall.initiatorId) {
      // Try to find initiator from conversations
      if (incomingCall.chatType === "direct") {
        const conversation = conversations.find(
          (conv) => conv.type === "direct" && conv.user._id === incomingCall.chatId
        );
        if (conversation) {
          setInitiatorInfo({
            fullName: conversation.user.fullName,
            profilePic: conversation.user.profilePic || "/avatar.png",
          });
        } else {
          setInitiatorInfo({
            fullName: "Caller",
            profilePic: "/avatar.png",
          });
        }
      } else {
        // For group calls, show group name
        const conversation = conversations.find(
          (conv) => conv.type === "group" && conv.group._id === incomingCall.chatId
        );
        if (conversation) {
          setInitiatorInfo({
            fullName: conversation.group.name,
            profilePic: null,
          });
        } else {
          setInitiatorInfo({
            fullName: "Group Call",
            profilePic: null,
          });
        }
      }
    }
  }, [incomingCall, conversations]);

  if (!incomingCall) return null;

  const isVideoCall = incomingCall.callType === "video";

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-base-100 rounded-lg shadow-2xl border border-base-300 p-4 min-w-[300px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="avatar">
            <div className="w-12 h-12 rounded-full">
              {incomingCall.chatType === "group" ? (
                <Avatar 
                  isGroup={true} 
                  group={conversations.find(
                    (conv) => conv.type === "group" && conv.group._id === incomingCall.chatId
                  )?.group || { name: initiatorInfo?.fullName || "Group Call" }} 
                  size={48} 
                />
              ) : (
                <Avatar 
                  user={{ fullName: initiatorInfo?.fullName || "Caller", profilePic: initiatorInfo?.profilePic }} 
                  size={48} 
                />
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{initiatorInfo?.fullName || "Incoming Call"}</h3>
            <p className="text-sm text-base-content/70">
              {isVideoCall ? "Video Call" : "Audio Call"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={rejectCall}
            className="btn btn-error btn-sm flex-1 gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            Decline
          </button>
          <button
            onClick={acceptCall}
            className="btn btn-success btn-sm flex-1 gap-2"
          >
            {isVideoCall ? (
              <Video className="w-4 h-4" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallNotification;
