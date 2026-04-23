import { useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { Check, X, Loader2, UserPlus } from "lucide-react";
import Avatar from "./Avatar";

const FriendRequests = () => {
  const {
    friendRequests,
    isRequestsLoading,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useFriendStore();

  useEffect(() => {
    getFriendRequests();
  }, [getFriendRequests]);

  if (isRequestsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const { sent, received } = friendRequests;

  return (
    <div className="p-3 space-y-4">
      {/* Received Requests */}
      <div>
        <h3 className="text-sm font-medium mb-2 px-2">Received Requests</h3>
        {received.length === 0 ? (
          <div className="text-center text-zinc-500 py-4 text-sm">No received requests</div>
        ) : (
          <div className="space-y-2">
            {received.map((request) => (
              <div
                key={request._id}
                className="flex items-center gap-3 p-3 bg-base-300 rounded-lg"
              >
                <Avatar user={request.senderId} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{request.senderId.fullName}</div>
                  <div className="text-xs text-zinc-400">Wants to be your friend</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => acceptFriendRequest(request._id)}
                    className="btn btn-xs btn-success"
                    title="Accept"
                  >
                    <Check className="size-3" />
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(request._id)}
                    className="btn btn-xs btn-error"
                    title="Reject"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Requests */}
      <div>
        <h3 className="text-sm font-medium mb-2 px-2">Sent Requests</h3>
        {sent.length === 0 ? (
          <div className="text-center text-zinc-500 py-4 text-sm">No sent requests</div>
        ) : (
          <div className="space-y-2">
            {sent.map((request) => (
              <div
                key={request._id}
                className="flex items-center gap-3 p-3 bg-base-300 rounded-lg opacity-75"
              >
                <Avatar user={request.receiverId} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{request.receiverId.fullName}</div>
                  <div className="text-xs text-zinc-400">Pending</div>
                </div>
                <div className="badge badge-warning">Pending</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;
