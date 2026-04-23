import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Group room management for group chats
  socket.on("joinGroup", (groupId) => {
    if (groupId) {
      socket.join(groupId.toString());
    }
  });

  socket.on("leaveGroup", (groupId) => {
    if (groupId) {
      socket.leave(groupId.toString());
    }
  });

  // Call signaling events
  socket.on("call-initiate", (data) => {
    const { callId, chatId, chatType, callType, targetUserIds, initiatorId } = data;
    
    // Join call room
    socket.join(callId);
    
    // Notify target users about incoming call
    targetUserIds.forEach((targetUserId) => {
      const targetSocketId = userSocketMap[targetUserId];
      if (targetSocketId) {
        io.to(targetSocketId).emit("incoming-call", {
          callId,
          chatId,
          chatType,
          callType,
          initiatorId,
        });
      }
    });
  });

  socket.on("call-accept", (data) => {
    const { callId, userId } = data;
    
    // Join call room
    socket.join(callId);
    
    // Notify all participants in the call room
    io.to(callId).emit("call-accepted", {
      callId,
      userId,
    });
  });

  socket.on("call-reject", (data) => {
    const { callId, userId } = data;
    
    // Notify all participants in the call room
    io.to(callId).emit("call-rejected", {
      callId,
      userId,
    });
  });

  socket.on("call-end", (data) => {
    const { callId } = data;
    
    // Notify all participants in the call room
    io.to(callId).emit("call-ended", {
      callId,
    });
    
    // Leave call room
    socket.leave(callId);
  });

  // WebRTC signaling events
  socket.on("webrtc-offer", (data) => {
    const { callId, offer, targetUserId } = data;
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-offer", {
        callId,
        offer,
        fromUserId: userId,
      });
    }
  });

  socket.on("webrtc-answer", (data) => {
    const { callId, answer, targetUserId } = data;
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-answer", {
        callId,
        answer,
        fromUserId: userId,
      });
    }
  });

  socket.on("webrtc-ice-candidate", (data) => {
    const { callId, candidate, targetUserId } = data;
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-ice-candidate", {
        callId,
        candidate,
        fromUserId: userId,
      });
    }
  });

  socket.on("call-participant-joined", (data) => {
    const { callId, userId } = data;
    io.to(callId).emit("call-participant-joined", {
      callId,
      userId,
    });
  });

  // Add participant to existing call
  socket.on("call-add-participant", (data) => {
    const { callId, chatId, chatType, callType, targetUserId, initiatorId } = data;
    
    // Send incoming call notification to the new participant
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call", {
        callId,
        chatId,
        chatType,
        callType,
        initiatorId,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
