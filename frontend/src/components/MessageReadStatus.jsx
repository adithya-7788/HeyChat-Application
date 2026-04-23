import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck } from "lucide-react";
import Avatar from "./Avatar";

const MessageReadStatus = ({ messageReadStatus, onClose, position }) => {
  if (!messageReadStatus) return null;

  const { readUsers, unreadUsers } = messageReadStatus;

  return (
    <div 
      className="absolute z-50 bg-base-100 border border-base-300 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto message-read-status-popup"
      style={{
        top: position.top,
        left: position.left,
        transform: position.isMobile ? 'translate(-50%, -50%)' : 'translate(-50%, 0)',
        maxWidth: '90vw',
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Message Read Status</h3>
        <button 
          onClick={onClose}
          className="text-base-content/60 hover:text-base-content"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {readUsers && readUsers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-success">
              <CheckCheck className="w-3 h-3" />
              Read by {readUsers.length}
            </div>
            <div className="space-y-2">
              {readUsers.map((user) => (
                <div key={user._id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden">
                    <Avatar user={user} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.fullName}</p>
                    <p className="text-xs text-base-content/60">
                      {messageReadStatus.readBy
                        .find(read => read.userId._id === user._id)
                        ?.readAt && formatMessageTime(
                          messageReadStatus.readBy.find(read => read.userId._id === user._id).readAt
                        )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {unreadUsers && unreadUsers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-warning">
              <Check className="w-3 h-3" />
              Not read by {unreadUsers.length}
            </div>
            <div className="space-y-2">
              {unreadUsers.map((user) => (
                <div key={user._id} className="flex items-center gap-2 opacity-60">
                  <div className="w-6 h-6 rounded-full overflow-hidden">
                    <Avatar user={user} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{user.fullName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!readUsers || readUsers.length === 0) && (!unreadUsers || unreadUsers.length === 0) && (
          <p className="text-sm text-base-content/60">No read status available</p>
        )}
      </div>
    </div>
  );
};

export default MessageReadStatus;
