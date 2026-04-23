import { useEffect } from "react";
import { useUserStore } from "../store/useUserStore";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2, UserPlus, Check } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Avatar from "../components/Avatar";

const ExplorePage = () => {
  const { exploreUsers, isExploring, getExploreUsers } = useUserStore();
  const { sendFriendRequest, isSendingRequest, friendRequests, getFriendRequests } = useFriendStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    getExploreUsers();
    getFriendRequests();
  }, [getExploreUsers, getFriendRequests]);

  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      await getFriendRequests();
    } catch (error) {
      // Error is handled in the store
    }
  };

  const isRequestSent = (userId) => {
    return friendRequests.sent.some((req) => {
      const receiverId = req.receiverId?._id || req.receiverId;
      return receiverId === userId || receiverId?.toString() === userId?.toString();
    });
  };

  const getBubbleSize = (index) => {
    const sizes = [
      "w-32 h-32",
      "w-36 h-36",
      "w-28 h-28",
      "w-40 h-40",
      "w-32 h-32",
      "w-36 h-36",
      "w-28 h-28",
      "w-40 h-40",
      "w-32 h-32",
      "w-36 h-36",
    ];
    return sizes[index % sizes.length];
  };

  const getBubblePosition = (index) => {
    const positions = [
      "top-10 left-10",
      "top-20 right-20",
      "top-40 left-20",
      "top-60 right-10",
      "top-80 left-40",
      "bottom-20 right-30",
      "bottom-40 left-10",
      "bottom-60 right-50",
      "bottom-80 left-30",
      "top-30 right-60",
    ];
    return positions[index % positions.length];
  };

  if (isExploring) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-7xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            <div className="flex-1 p-8 overflow-y-auto">
              <h1 className="text-3xl font-bold mb-8">Explore Users</h1>

              {exploreUsers.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-base-content/60 text-lg">No users available to explore</p>
                </div>
              ) : (
                <div className="relative min-h-[600px] bg-base-200 rounded-2xl p-8 overflow-hidden">
            {exploreUsers.map((user, index) => {
              const bubbleSize = getBubbleSize(index);
              const bubblePosition = getBubblePosition(index);
              const requestSent = isRequestSent(user._id);

              return (
                <div
                  key={user._id}
                  className={`absolute ${bubblePosition} ${bubbleSize} group cursor-pointer transition-all duration-300 hover:scale-110`}
                >
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative w-full h-full bg-base-200 rounded-full border-4 border-primary/30 group-hover:border-primary flex flex-col items-center justify-center p-4 shadow-lg">
                      <div className="mb-2">
                        <Avatar user={user} size={64} showBorder />
                      </div>
                      <p className="text-xs font-medium text-center truncate w-full px-2">
                        {user.fullName}
                      </p>
                      <button
                        onClick={() => handleSendRequest(user._id)}
                        disabled={isSendingRequest || requestSent}
                        className={`mt-2 btn btn-xs ${
                          requestSent
                            ? "btn-success"
                            : "btn-primary"
                        } ${isSendingRequest ? "loading" : ""}`}
                      >
                        {requestSent ? (
                          <>
                            <Check className="size-3" />
                            Sent
                          </>
                        ) : (
                          <>
                            <UserPlus className="size-3" />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
