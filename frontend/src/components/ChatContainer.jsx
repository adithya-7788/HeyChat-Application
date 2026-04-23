import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, MoreVertical, Trash2, X } from "lucide-react";
import { useMediaViewerStore } from "../store/useMediaViewerStore";
import Avatar from "./Avatar";
import MessageReadStatus from "./MessageReadStatus";

const ChatContainer = ({ onBack }) => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    activeConversation,
    subscribeToMessages,
    unsubscribeFromMessages,
    isSelectionMode,
    selectedMessages,
    toggleSelectionMode,
    toggleMessageSelection,
    clearSelection,
    deleteSelectedMessages,
    messageReadStatus,
    getMessageReadStatus,
    clearMessageReadStatus,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const { openMedia } = useMediaViewerStore();
  const [readStatusPosition, setReadStatusPosition] = useState(null);

  useEffect(() => {
    if (!activeConversation) return;
    getMessages();
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [activeConversation, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Cleanup selection and read status when conversation changes
  useEffect(() => {
    clearSelection();
    clearMessageReadStatus();
    setReadStatusPosition(null);
  }, [activeConversation, clearSelection, clearMessageReadStatus]);

  // Close read status popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (readStatusPosition && !e.target.closest('.message-read-status-popup')) {
        handleCloseReadStatus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [readStatusPosition]);

  const handleShowReadStatus = async (e, messageId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const popupWidth = 320; // Approximate width of the popup
    const popupHeight = 384; // Approximate max height of the popup
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth < 768;

    let top, left;

    if (isMobile) {
      // On mobile, center the popup
      top = viewportHeight / 2;
      left = viewportWidth / 2;
    } else {
      // On desktop, position near the message
      top = rect.top;
      left = rect.left + rect.width / 2;

      // Check if popup would go above the viewport
      if (top - popupHeight < 0) {
        // Position below the message instead
        top = rect.bottom + 8; // 8px gap
      } else {
        // Position above the message
        top = top - popupHeight - 8; // 8px gap
      }

      // Ensure popup doesn't go off-screen horizontally
      const popupLeft = left - popupWidth / 2;
      if (popupLeft < 10) {
        left = popupWidth / 2 + 10; // Align to left edge with padding
      } else if (popupLeft + popupWidth > viewportWidth - 10) {
        left = viewportWidth - popupWidth / 2 - 10; // Align to right edge with padding
      }
    }

    setReadStatusPosition({ top, left, isMobile });
    await getMessageReadStatus(messageId);
  };

  const handleCloseReadStatus = () => {
    clearMessageReadStatus();
    setReadStatusPosition(null);
  };

  const handleMessageClick = (messageId) => {
    if (isSelectionMode) {
      toggleMessageSelection(messageId);
    }
  };

  const handleDeleteMessages = async () => {
    if (selectedMessages.size > 0) {
      await deleteSelectedMessages();
    }
  };

  if (!activeConversation) {
    return null;
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader onBack={onBack} />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader onBack={onBack} />

      {/* Selection Mode Header */}
      {isSelectionMode && (
        <div className="bg-base-200 border-b border-base-300 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectionMode}
              className="text-base-content/60 hover:text-base-content"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium">
              {selectedMessages.size} {selectedMessages.size === 1 ? 'message' : 'messages'} selected
            </span>
          </div>
          {selectedMessages.size > 0 && (
            <button
              onClick={handleDeleteMessages}
              className="flex items-center gap-2 px-3 py-1 bg-error text-error-content rounded-lg hover:bg-error/90 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete</span>
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isGroup = activeConversation.type === "group";
          const senderId = typeof message.senderId === "object" ? message.senderId._id : message.senderId;
          const senderInfo = typeof message.senderId === "object" ? message.senderId : null;
          const isOwn = senderId === authUser._id;
          const status = message.status || (message.seen ? "seen" : "sent");
          const senderName = isGroup && senderInfo ? senderInfo.fullName : null;
          const isSelected = selectedMessages.has(message._id);

          return (
            <div
              key={message._id}
              className={`chat ${isOwn ? "chat-end" : "chat-start"} ${isSelectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-primary/10' : ''}`}
              onClick={() => handleMessageClick(message._id)}
            >
              <div className=" chat-image avatar">
                <div className="size-10 rounded-full border">
                  {isOwn ? (
                    <Avatar user={authUser} size={40} />
                  ) : isGroup && senderInfo ? (
                    <Avatar user={senderInfo} size={40} />
                  ) : (
                    <Avatar user={activeConversation.user} size={40} />
                  )}
                </div>
              </div>
              <div className="chat-header mb-1 flex items-center gap-2">
                {isGroup && !isOwn && senderName && (
                  <span className="text-xs font-medium opacity-70">{senderName}</span>
                )}
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
                {isOwn && (
                  <span className="flex items-center gap-1 text-[10px] text-base-content/60">
                    {isGroup ? (
                      // For groups, show tick marks (seen by all would require tracking)
                      message.seen ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-primary" />
                          <span>Sent</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Sent</span>
                        </>
                      )
                    ) : status === "seen" ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-primary" />
                        <span>Seen</span>
                      </>
                    ) : status === "delivered" ? (
                      <>
                        <CheckCheck className="w-3 h-3" />
                        <span>Delivered</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Sent</span>
                      </>
                    )}
                  </span>
                )}
                {/* 3-dot menu for read status */}
                <button
                  onClick={(e) => handleShowReadStatus(e, message._id)}
                  className="opacity-0 hover:opacity-100 transition-opacity p-1 hover:bg-base-200 rounded"
                >
                  <MoreVertical className="w-4 h-4 text-base-content/60" />
                </button>
              </div>
              <div className="chat-bubble flex flex-col max-w-full">
                {message.image && (
                  <button
                    type="button"
                    onClick={() => openMedia(message.image, "image")}
                    className="mb-2 rounded-lg overflow-hidden max-w-xs sm:max-w-sm md:max-w-md"
                  >
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="w-full h-auto object-cover"
                    />
                  </button>
                )}
                {message.video && (
                  <button
                    type="button"
                    onClick={() => openMedia(message.video, "video")}
                    className="mb-2 rounded-lg overflow-hidden max-w-xs sm:max-w-sm md:max-w-md"
                  >
                    <video
                      src={message.video}
                      className="w-full h-auto"
                      muted
                      playsInline
                    />
                  </button>
                )}
                {message.text && <p className="break-words">{message.text}</p>}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {/* Message Read Status Popup */}
      {readStatusPosition && (
        <MessageReadStatus
          messageReadStatus={messageReadStatus}
          onClose={handleCloseReadStatus}
          position={readStatusPosition}
        />
      )}

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
