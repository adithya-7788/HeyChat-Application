import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Video, Clock } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useState } from "react";
import { formatMessageTime } from "../lib/utils";
import Avatar from "./Avatar";

const CallHistory = ({ chatId = null }) => {
  const { callHistory, isCallHistoryLoading, getCallHistory, initiateCall } = useCallStore();
  const { authUser } = useAuthStore();
  const [selectedCall, setSelectedCall] = useState(null);

  useEffect(() => {
    getCallHistory(chatId);
  }, [chatId, getCallHistory]);

  const getCallDirectionIcon = (call, userStatus) => {
    const isOutgoing = userStatus === "outgoing";
    return isOutgoing ? (
      <PhoneOutgoing className="w-3 h-3 text-primary" />
    ) : (
      <PhoneIncoming className="w-3 h-3 text-success" />
    );
  };

  const getCallStatusText = (call, userStatus, participantStatus) => {
    if (participantStatus === "missed") {
      return userStatus === "outgoing" ? "Missed" : "Missed call";
    }
    if (participantStatus === "rejected") {
      return "Rejected";
    }
    if (call.status === "ended") {
      return call.duration > 0
        ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, "0")}`
        : "Ended";
    }
    if (call.status === "connected") {
      return "Connected";
    }
    return call.status;
  };

  const getOtherParticipant = (call) => {
    if (call.chatType === "group") {
      return {
        name: call.chatName || "Group Call",
        isGroup: true,
        group: call.chatGroup || { name: call.chatName },
      };
    }
    
    const otherParticipant = call.participants.find(
      (p) => p.userId._id.toString() !== authUser._id.toString()
    );
    
    if (otherParticipant) {
      return {
        name: otherParticipant.userId.fullName,
        profilePic: otherParticipant.userId.profilePic,
        isGroup: false,
      };
    }
    
    return {
      name: call.initiator._id.toString() === authUser._id.toString()
        ? "You"
        : call.initiator.fullName,
      profilePic: call.initiator.profilePic,
      isGroup: false,
    };
  };

  const handleCallAgain = async (e, call) => {
    e.stopPropagation();
    
    try {
      if (call.chatType === "group") {
        // For group calls: use chatId and filter out current user from participants
        const participantIds = call.participants
          .map((p) => typeof p.userId === "object" ? p.userId._id : p.userId)
          .filter((id) => id.toString() !== authUser._id.toString());
        
        await initiateCall(call.chatId, "group", call.callType, participantIds);
      } else {
        // For direct calls: chatId is the other user's ID
        const otherParticipant = call.participants.find(
          (p) => p.userId._id.toString() !== authUser._id.toString()
        );
        
        if (otherParticipant) {
          const otherUserId = typeof otherParticipant.userId === "object" 
            ? otherParticipant.userId._id 
            : otherParticipant.userId;
          
          await initiateCall(otherUserId, "direct", call.callType, [otherUserId]);
        }
      }
    } catch (error) {
      console.error("Failed to initiate call from history:", error);
    }
  };

  if (isCallHistoryLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  if (callHistory.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-base-content/60 p-8">
        <PhoneCall className="w-12 h-12 mb-3 opacity-30" />
        <p>No call history</p>
        <p className="text-xs mt-1">Your calls will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {callHistory.map((call) => {
        const otherParticipant = getOtherParticipant(call);
        const userStatus = call.userStatus || "incoming";
        const participantStatus = call.participantStatus || call.status;
        const isVideoCall = call.callType === "video";

        return (
          <div key={call._id}>
            <div className="w-full p-3 hover:bg-base-200 transition-colors">
              <div className="flex items-center gap-3">
                {/* Participant info */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setSelectedCall(selectedCall?._id === call._id ? null : call)}
                >
                  <div className="flex items-center gap-2">
                    {otherParticipant.isGroup ? (
                      <Avatar isGroup={true} group={otherParticipant.group} size={32} />
                    ) : (
                      <Avatar 
                        user={{ fullName: otherParticipant.name, profilePic: otherParticipant.profilePic }} 
                        size={32} 
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {getCallDirectionIcon(call, userStatus)}
                        <p className="font-medium text-sm truncate">
                          {otherParticipant.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-base-content/60">
                        <span>{getCallStatusText(call, userStatus, participantStatus)}</span>
                        <span>•</span>
                        <span>{formatMessageTime(call.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call again button */}
                <button
                  onClick={(e) => handleCallAgain(e, call)}
                  className="flex-shrink-0 p-2 hover:bg-base-300 rounded-lg transition-colors"
                  title={`Start ${isVideoCall ? "video" : "audio"} call`}
                >
                  {isVideoCall ? (
                    <Video className="w-4 h-4 text-primary" />
                  ) : (
                    <Phone className="w-4 h-4 text-primary" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded call details */}
            {selectedCall?._id === call._id && (
              <div className="px-3 pb-3 border-b border-base-300 bg-base-200/50">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(call.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {call.startedAt && (
                    <div>
                      <span className="font-medium">Started: </span>
                      {new Date(call.startedAt).toLocaleString()}
                    </div>
                  )}
                  {call.endedAt && (
                    <div>
                      <span className="font-medium">Ended: </span>
                      {new Date(call.endedAt).toLocaleString()}
                    </div>
                  )}
                  {call.duration > 0 && (
                    <div>
                      <span className="font-medium">Duration: </span>
                      {Math.floor(call.duration / 60)}:
                      {String(call.duration % 60).padStart(2, "0")}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Type: </span>
                    {call.callType === "video" ? "Video Call" : "Audio Call"}
                  </div>
                  {call.participants && call.participants.length > 0 && (
                    <div>
                      <span className="font-medium">Participants: </span>
                      {call.participants.map((p, idx) => (
                        <span key={idx}>
                          {typeof p.userId === "object" ? p.userId.fullName : "Unknown"}
                          {idx < call.participants.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CallHistory;
