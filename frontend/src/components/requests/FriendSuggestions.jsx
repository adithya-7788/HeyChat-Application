import { useEffect, useState, useRef } from "react";
import { useUserStore } from "../../store/useUserStore";
import { useFriendStore } from "../../store/useFriendStore";
import { useAuthStore } from "../../store/useAuthStore";
import { Loader2, UserPlus, Check, Search } from "lucide-react";
import Avatar from "../Avatar";

const FriendSuggestions = () => {
  const { exploreUsers, isExploring, getExploreUsers, searchResults, isSearching, searchUsers } = useUserStore();
  const { sendFriendRequest, isSendingRequest, friendRequests, getFriendRequests, friends, getFriends } = useFriendStore();
  const { authUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  useEffect(() => {
    getExploreUsers();
    getFriendRequests();
    getFriends();
  }, [getExploreUsers, getFriendRequests, getFriends]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    } else {
      searchUsers(""); // Clear results when search is empty
    }
  }, [searchQuery, searchUsers]);

  // Maintain focus on search input during typing
  useEffect(() => {
    const inputEl = searchInputRef.current;
    if (inputEl && document.activeElement !== inputEl) {
      inputEl.focus();
    }
  });

  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      await getFriendRequests();
    } catch {
      // Error is handled in the store
    }
  };

  const isRequestSent = (userId) => {
    return friendRequests.sent.some((req) => {
      const receiverId = req.receiverId?._id || req.receiverId;
      return receiverId === userId || receiverId?.toString() === userId?.toString();
    });
  };

  const isFriend = (userId) => {
    return friends.some((friend) => friend._id === userId || friend._id?.toString() === userId?.toString());
  };

  // Filter out already-friended users
  const filteredExploreUsers = exploreUsers.filter((user) => {
    if (user._id === authUser._id) return false;
    return !isFriend(user._id);
  });

  // Use search results if searching, otherwise use explore users
  const displayUsers = searchQuery.trim().length > 0 ? searchResults : filteredExploreUsers;
  const filteredDisplayUsers = displayUsers.filter((user) => {
    if (user._id === authUser._id) return false;
    return !isFriend(user._id);
  });

  const isLoading = searchQuery.trim().length > 0 ? isSearching : isExploring;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!authUser) return null;

  return (
    <div className="h-full flex flex-col bg-base-100 overflow-hidden">
      <div className="p-6 pb-4">
        <h2 className="text-lg font-semibold mb-2">Discover new friends</h2>
        <p className="text-xs text-base-content/60 mb-4">
          {searchQuery.trim().length > 0 
            ? "Search results" 
            : "Send requests to people you may want to connect with"}
        </p>
        
        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/40" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm input-bordered w-full pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filteredDisplayUsers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base-content/60 text-sm">
              {searchQuery.trim().length > 0 
                ? "No users found" 
                : "No users available to explore right now"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredDisplayUsers.map((user) => {
              const requestSent = isRequestSent(user._id);

              return (
                <div
                  key={user._id}
                  className="bg-base-200 rounded-xl p-4 flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <Avatar user={user} size={64} showBorder />
                  <div className="space-y-1 w-full">
                    <p className="text-sm font-medium truncate">{user.fullName}</p>
                    <p className="text-[11px] text-base-content/60 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleSendRequest(user._id)}
                    disabled={isSendingRequest || requestSent}
                    className={`btn btn-xs w-full ${
                      requestSent ? "btn-success" : "btn-primary"
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendSuggestions;

