import { PhoneOff, Mic, MicOff, Video, VideoOff, UserPlus, X } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useEffect, useRef, useState } from "react";

const CallContainer = () => {
  const {
    activeCall,
    localStream,
    remoteStreams,
    callStatus,
    endCall,
    toggleMute,
    toggleVideo,
    addParticipantToCall,
  } = useCallStore();
  const { authUser } = useAuthStore();
  const { friends, getFriends } = useFriendStore();
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [addingParticipant, setAddingParticipant] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([oduserId, stream]) => {
      if (remoteVideoRefs.current[oduserId]) {
        remoteVideoRefs.current[oduserId].srcObject = stream;
      }
    });
  }, [remoteStreams]);

  // Fetch friends when add person popup opens
  useEffect(() => {
    if (showAddPerson) {
      getFriends();
    }
  }, [showAddPerson, getFriends]);

  if (!activeCall) return null;

  const isVideoCall = activeCall.callType === "video";
  // Filter out local user from remote streams to avoid duplicates
  const remoteStreamsArray = Object.entries(remoteStreams).filter(
    ([userId]) => userId !== authUser._id
  );
  const isMuted = localStream?.getAudioTracks()[0]?.enabled === false;
  const isVideoOff = localStream?.getVideoTracks()[0]?.enabled === false;

  // Get participant info from activeCall
  const getParticipantName = (userId) => {
    if (activeCall.participants) {
      const participant = activeCall.participants.find((p) => {
        const pId = typeof p.userId === "object" ? p.userId._id : p.userId;
        return pId === userId;
      });
      if (participant && typeof participant.userId === "object") {
        return participant.userId.fullName || "Participant";
      }
    }
    return "Participant";
  };

  const getParticipantProfilePic = (userId) => {
    if (activeCall.participants) {
      const participant = activeCall.participants.find((p) => {
        const pId = typeof p.userId === "object" ? p.userId._id : p.userId;
        return pId === userId;
      });
      if (participant && typeof participant.userId === "object") {
        return participant.userId.profilePic;
      }
    }
    return null;
  };

  // Get list of participants already in call
  const participantsInCall = activeCall.participants?.map((p) =>
    typeof p.userId === "object" ? p.userId._id : p.userId
  ) || [];

  // Filter friends who are not already in call
  const availableFriends = friends.filter(
    (friend) => !participantsInCall.includes(friend._id)
  );

  // Filter available friends based on search query
  const filteredFriends = availableFriends.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddParticipant = async (friendId) => {
    setAddingParticipant(friendId);
    try {
      await addParticipantToCall(friendId);
      setShowAddPerson(false);
    } catch (error) {
      console.error("Failed to add participant:", error);
    } finally {
      setAddingParticipant(null);
    }
  };

  // Calculate grid columns based on total participants (including self)
  const totalParticipants = remoteStreamsArray.length + 1; // +1 for local user
  const getGridCols = () => {
    if (totalParticipants === 1) return "grid-cols-1";
    if (totalParticipants === 2) return "grid-cols-1 md:grid-cols-2";
    if (totalParticipants <= 4) return "grid-cols-2";
    if (totalParticipants <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  return (
    <div className="flex-1 flex flex-col bg-base-200 relative">
      {/* Participants grid - includes local user as a tile */}
      <div className={`flex-1 grid ${getGridCols()} gap-2 p-4 auto-rows-fr`}>
        {/* Local user tile */}
        <div className="relative bg-base-300 rounded-lg overflow-hidden aspect-video flex flex-col">
          {isVideoCall && localStream ? (
            <div className="flex-1 relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-300">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-16 h-16">
                      {authUser?.profilePic ? (
                        <img src={authUser.profilePic} alt={authUser.fullName} className="rounded-full" />
                      ) : (
                        <span className="text-2xl">{authUser?.fullName?.[0] || "Y"}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-primary/20">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-16 h-16">
                  {authUser?.profilePic ? (
                    <img src={authUser.profilePic} alt={authUser.fullName} className="rounded-full" />
                  ) : (
                    <span className="text-2xl">{authUser?.fullName?.[0] || "Y"}</span>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Name label */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <p className="text-white text-sm font-medium truncate">
              {authUser?.fullName || "You"} (You)
            </p>
          </div>
        </div>

        {/* Remote participants tiles */}
        {remoteStreamsArray.length === 0 && callStatus !== "connected" ? (
          <div className="col-span-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📞</div>
              <p className="text-lg font-medium">
                {callStatus === "calling" || callStatus === "ringing"
                  ? "Calling..."
                  : "Waiting for participants"}
              </p>
            </div>
          </div>
        ) : (
          remoteStreamsArray.map(([userId, stream]) => (
            <div
              key={userId}
              className="relative bg-base-300 rounded-lg overflow-hidden aspect-video flex flex-col"
            >
              {isVideoCall ? (
                <div className="flex-1 relative">
                  <video
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current[userId] = el;
                        el.srcObject = stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-primary/20">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-16 h-16">
                      {getParticipantProfilePic(userId) ? (
                        <img src={getParticipantProfilePic(userId)} alt={getParticipantName(userId)} className="rounded-full" />
                      ) : (
                        <span className="text-2xl">{getParticipantName(userId)?.[0] || "P"}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Name label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-sm font-medium truncate">
                  {getParticipantName(userId)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Person Popup */}
      {showAddPerson && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg shadow-xl w-80 max-h-96 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <h3 className="font-semibold text-lg">Add to Call</h3>
              <button
                onClick={() => {
                  setShowAddPerson(false);
                  setSearchQuery("");
                }}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-base-300">
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-sm input-bordered w-full"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredFriends.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">
                  <p>{searchQuery.length > 0 ? "No friends found" : "No friends available to add"}</p>
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg cursor-pointer"
                    onClick={() => handleAddParticipant(friend._id)}
                  >
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        {friend.profilePic ? (
                          <img src={friend.profilePic} alt={friend.fullName} />
                        ) : (
                          <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full">
                            {friend.fullName?.[0] || "?"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{friend.fullName}</p>
                    </div>
                    <button
                      className={`btn btn-sm btn-primary ${addingParticipant === friend._id ? "loading" : ""}`}
                      disabled={addingParticipant === friend._id}
                    >
                      {addingParticipant === friend._id ? "" : "Add"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Call controls */}
      <div className="bg-base-100 border-t border-base-300 p-4">
        <div className="flex items-center justify-center gap-4">
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className={`btn btn-circle ${isMuted ? "btn-error" : "btn-ghost"}`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video toggle (only for video calls) */}
          {isVideoCall && (
            <button
              onClick={toggleVideo}
              className={`btn btn-circle ${isVideoOff ? "btn-error" : "btn-ghost"}`}
              title={isVideoOff ? "Turn on video" : "Turn off video"}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Add person */}
          <button
            onClick={() => setShowAddPerson(true)}
            className="btn btn-circle btn-ghost"
            title="Add person to call"
          >
            <UserPlus className="w-5 h-5" />
          </button>

          {/* End call */}
          <button
            onClick={endCall}
            className="btn btn-circle btn-error"
            title="End call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Call status */}
        <div className="text-center mt-2">
          <p className="text-sm text-base-content/70">
            {callStatus === "calling" && "Calling..."}
            {callStatus === "ringing" && "Ringing..."}
            {callStatus === "connected" && `Connected • ${totalParticipants} participant(s)`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CallContainer;
