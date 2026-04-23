import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useCallStore = create((set, get) => ({
  // Active call state
  activeCall: null, // { callId, chatId, chatType, callType, participants, status }
  localStream: null,
  remoteStreams: {}, // { userId: MediaStream }
  peerConnections: {}, // { userId: RTCPeerConnection }
  
  // Call history
  callHistory: [],
  isCallHistoryLoading: false,
  
  // UI state
  isCallActive: false,
  callStatus: null, // "calling" | "ringing" | "connected" | "ended"
  incomingCall: null, // { callId, chatId, chatType, callType, initiatorId }
  
  // Initialize call listeners
  initializeCallListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    // Remove existing listeners first to prevent duplicates
    socket.off("incoming-call");
    socket.off("call-accepted");
    socket.off("call-rejected");
    socket.off("call-ended");
    socket.off("webrtc-offer");
    socket.off("webrtc-answer");
    socket.off("webrtc-ice-candidate");
    socket.off("call-participant-joined");
    
    // Incoming call notification
    socket.on("incoming-call", (data) => {
      set({ incomingCall: data });
    });
    
    // Call accepted
    socket.on("call-accepted", async (data) => {
      const { callId, userId } = data;
      const { activeCall } = get();
      
      if (activeCall && activeCall.callId === callId) {
        // Update participant status
        const updatedCall = {
          ...activeCall,
          participants: activeCall.participants.map((p) =>
            p.userId === userId ? { ...p, status: "connected" } : p
          ),
        };
        set({ activeCall: updatedCall });
        
        // Create peer connection if not exists
        if (!get().peerConnections[userId]) {
          await get().createPeerConnection(userId, callId);
        }
      }
    });
    
    // Call rejected
    socket.on("call-rejected", (data) => {
      const { callId, userId } = data;
      const { activeCall } = get();
      
      if (activeCall && activeCall.callId === callId) {
        toast.error("Call rejected");
        get().endCall();
      }
    });
    
    // Call ended
    socket.on("call-ended", (data) => {
      const { callId } = data;
      const { activeCall } = get();
      
      if (activeCall && activeCall.callId === callId) {
        get().endCall();
      }
    });
    
    // WebRTC signaling
    socket.on("webrtc-offer", async (data) => {
      const { callId, offer, fromUserId } = data;
      await get().handleOffer(offer, fromUserId, callId);
    });
    
    socket.on("webrtc-answer", async (data) => {
      const { callId, answer, fromUserId } = data;
      await get().handleAnswer(answer, fromUserId);
    });
    
    socket.on("webrtc-ice-candidate", async (data) => {
      const { candidate, fromUserId } = data;
      await get().handleIceCandidate(candidate, fromUserId);
    });
    
    socket.on("call-participant-joined", (data) => {
      const { callId, userId } = data;
      const { activeCall } = get();
      
      if (activeCall && activeCall.callId === callId) {
        // Add participant to call
        const updatedCall = {
          ...activeCall,
          participants: [
            ...activeCall.participants,
            { userId, status: "connected" },
          ],
        };
        set({ activeCall: updatedCall });
      }
    });
  },
  
  // Clean up call listeners
  cleanupCallListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    socket.off("incoming-call");
    socket.off("call-accepted");
    socket.off("call-rejected");
    socket.off("call-ended");
    socket.off("webrtc-offer");
    socket.off("webrtc-answer");
    socket.off("webrtc-ice-candidate");
    socket.off("call-participant-joined");
  },
  
  // Initiate a call
  initiateCall: async (chatId, chatType, callType, participantIds) => {
    try {
      const { authUser } = useAuthStore.getState();
      const socket = useAuthStore.getState().socket;
      
      if (!socket) {
        toast.error("Not connected to server");
        return;
      }
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      
      set({ localStream: stream });
      
      // Create call record
      const res = await axiosInstance.post("/calls", {
        chatId,
        chatType,
        callType,
        participantIds,
      });
      
      const call = res.data;
      const callId = call.callId;
      
      // Set active call
      set({
        activeCall: {
          callId,
          chatId,
          chatType,
          callType,
          participants: call.participants,
          status: "ringing",
        },
        isCallActive: true,
        callStatus: "calling",
        incomingCall: null,
      });
      
      // Emit call initiation
      socket.emit("call-initiate", {
        callId,
        chatId,
        chatType,
        callType,
        targetUserIds: participantIds,
        initiatorId: authUser._id,
      });
      
      // Create peer connections for each participant
      for (const userId of participantIds) {
        await get().createPeerConnection(userId, callId);
      }
      
      // Join call room
      socket.emit("call-participant-joined", { callId, userId: authUser._id });
      
    } catch (error) {
      console.error("Error initiating call:", error);
      toast.error("Failed to initiate call");
      get().endCall();
    }
  },
  
  // Accept incoming call
  acceptCall: async () => {
    try {
      const { incomingCall } = get();
      if (!incomingCall) return;
      
      const { authUser } = useAuthStore.getState();
      const socket = useAuthStore.getState().socket;
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === "video",
      });
      
      set({ localStream: stream });
      
      // Update call status
      await axiosInstance.patch(`/calls/${incomingCall.callId}/status`, {
        status: "connected",
        participantStatus: "connected",
      });
      
      // Get call details to see existing participants
      const callDetailsRes = await axiosInstance.get(`/calls/${incomingCall.callId}`);
      const callDetails = callDetailsRes.data;
      
      // Set active call
      set({
        activeCall: {
          callId: incomingCall.callId,
          chatId: incomingCall.chatId,
          chatType: incomingCall.chatType,
          callType: incomingCall.callType,
          participants: callDetails.participants || [],
          status: "connected",
        },
        isCallActive: true,
        callStatus: "connected",
        incomingCall: null,
      });
      
      // Emit call acceptance
      socket.emit("call-accept", {
        callId: incomingCall.callId,
        userId: authUser._id,
      });
      
      // Join call room
      socket.emit("call-participant-joined", {
        callId: incomingCall.callId,
        userId: authUser._id,
      });
      
      // Create peer connections with existing participants (except self and initiator if we're not the initiator)
      const existingParticipants = callDetails.participants || [];
      for (const participant of existingParticipants) {
        const participantId = typeof participant.userId === "object" 
          ? participant.userId._id 
          : participant.userId;
        
        if (participantId !== authUser._id && participant.status === "connected") {
          await get().createPeerConnection(participantId, incomingCall.callId);
        }
      }
      
    } catch (error) {
      console.error("Error accepting call:", error);
      toast.error("Failed to accept call");
      get().rejectCall();
    }
  },
  
  // Reject incoming call
  rejectCall: async () => {
    try {
      const { incomingCall } = get();
      if (!incomingCall) return;
      
      const { authUser } = useAuthStore.getState();
      const socket = useAuthStore.getState().socket;
      
      // Update call status
      await axiosInstance.patch(`/calls/${incomingCall.callId}/status`, {
        status: "rejected",
        participantStatus: "rejected",
      });
      
      // Emit call rejection
      socket.emit("call-reject", {
        callId: incomingCall.callId,
        userId: authUser._id,
      });
      
      set({ incomingCall: null });
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  },
  
  // End active call
  endCall: async () => {
    const { activeCall, localStream, remoteStreams, peerConnections } = get();
    
    try {
      const socket = useAuthStore.getState().socket;
      
      // Update call status if there's an active call
      if (activeCall?.callId) {
        try {
          await axiosInstance.patch(`/calls/${activeCall.callId}/status`, {
            status: "ended",
            participantStatus: "ended",
          });
        } catch (error) {
          console.error("Error updating call status:", error);
        }
        
        // Emit call end
        if (socket) {
          socket.emit("call-end", { callId: activeCall.callId });
        }
      }
      
    } catch (error) {
      console.error("Error ending call:", error);
    } finally {
      // Always cleanup media and connections regardless of API errors
      
      // Stop all local media tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (error) {
            console.error("Error stopping track:", error);
          }
        });
      }
      
      // Stop all remote streams
      if (remoteStreams) {
        Object.values(remoteStreams).forEach((stream) => {
          if (stream) {
            stream.getTracks().forEach((track) => {
              try {
                track.stop();
              } catch (error) {
                console.error("Error stopping remote track:", error);
              }
            });
          }
        });
      }
      
      // Close all peer connections
      if (peerConnections) {
        Object.values(peerConnections).forEach((pc) => {
          if (pc) {
            try {
              pc.close();
            } catch (error) {
              console.error("Error closing peer connection:", error);
            }
          }
        });
      }
      
      // Reset state
      set({
        activeCall: null,
        localStream: null,
        remoteStreams: {},
        peerConnections: {},
        isCallActive: false,
        callStatus: null,
      });
      
      // Refresh call history
      try {
        await get().getCallHistory();
      } catch (error) {
        console.error("Error refreshing call history:", error);
      }
    }
  },
  
  // Create peer connection
  createPeerConnection: async (targetUserId, callId) => {
    try {
      const { localStream } = get();
      const { authUser } = useAuthStore.getState();
      const socket = useAuthStore.getState().socket;
      
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };
      
      const pc = new RTCPeerConnection(configuration);
      
      // Add local stream tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }
      
      // Handle remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        set((state) => ({
          remoteStreams: {
            ...state.remoteStreams,
            [targetUserId]: remoteStream,
          },
        }));
      };
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("webrtc-ice-candidate", {
            callId,
            candidate: event.candidate,
            targetUserId,
          });
        }
      };
      
      // Store peer connection
      set((state) => ({
        peerConnections: {
          ...state.peerConnections,
          [targetUserId]: pc,
        },
      }));
      
      // Create and send offer if we're the initiator or if call is already connected (for new joiners)
      const { activeCall } = get();
      if (activeCall) {
        // If we're initiating or the call is connected and we're joining, create an offer
        if (activeCall.status === "ringing" || activeCall.status === "connected") {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          if (socket) {
            socket.emit("webrtc-offer", {
              callId,
              offer,
              targetUserId,
            });
          }
        }
      }
      
    } catch (error) {
      console.error("Error creating peer connection:", error);
    }
  },
  
  // Handle WebRTC offer
  handleOffer: async (offer, fromUserId, callId) => {
    try {
      const { localStream } = get();
      const socket = useAuthStore.getState().socket;
      
      let pc = get().peerConnections[fromUserId];
      
      if (!pc) {
        const configuration = {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        };
        
        pc = new RTCPeerConnection(configuration);
        
        if (localStream) {
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
          });
        }
        
        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          set((state) => ({
            remoteStreams: {
              ...state.remoteStreams,
              [fromUserId]: remoteStream,
            },
          }));
        };
        
        pc.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit("webrtc-ice-candidate", {
              callId,
              candidate: event.candidate,
              targetUserId: fromUserId,
            });
          }
        };
        
        set((state) => ({
          peerConnections: {
            ...state.peerConnections,
            [fromUserId]: pc,
          },
        }));
      }
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (socket) {
        socket.emit("webrtc-answer", {
          callId,
          answer,
          targetUserId: fromUserId,
        });
      }
      
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  },
  
  // Handle WebRTC answer
  handleAnswer: async (answer, fromUserId) => {
    try {
      const pc = get().peerConnections[fromUserId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  },
  
  // Handle ICE candidate
  handleIceCandidate: async (candidate, fromUserId) => {
    try {
      const pc = get().peerConnections[fromUserId];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  },
  
  // Get call history
  getCallHistory: async (chatId = null) => {
    set({ isCallHistoryLoading: true });
    try {
      const endpoint = chatId ? `/calls/history/${chatId}` : "/calls/history/all";
      const res = await axiosInstance.get(endpoint);
      set({ callHistory: res.data });
    } catch (error) {
      console.error("Error getting call history:", error);
    } finally {
      set({ isCallHistoryLoading: false });
    }
  },
  
  // Toggle mute
  toggleMute: () => {
    const { localStream } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  },
  
  // Toggle video
  toggleVideo: () => {
    const { localStream } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  },

  // Add participant to active call
  addParticipantToCall: async (participantId) => {
    try {
      const { activeCall } = get();
      if (!activeCall) {
        toast.error("No active call");
        return;
      }

      const { authUser } = useAuthStore.getState();
      const socket = useAuthStore.getState().socket;

      if (!socket) {
        toast.error("Not connected to server");
        return;
      }

      // Add participant to call via API
      const res = await axiosInstance.post(`/calls/${activeCall.callId}/add-participant`, {
        participantId,
      });

      const updatedCall = res.data;

      // Update active call with new participant
      set({
        activeCall: {
          ...activeCall,
          participants: updatedCall.participants,
        },
      });

      // Emit socket event to notify the new participant
      socket.emit("call-add-participant", {
        callId: activeCall.callId,
        chatId: activeCall.chatId,
        chatType: activeCall.chatType,
        callType: activeCall.callType,
        targetUserId: participantId,
        initiatorId: authUser._id,
      });

      toast.success("Participant added to call");
    } catch (error) {
      console.error("Error adding participant to call:", error);
      toast.error(error.response?.data?.error || "Failed to add participant");
      throw error;
    }
  },
}));
