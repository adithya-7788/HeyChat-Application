import { useState, useEffect, useMemo } from "react";
import { useUserStore } from "../store/useUserStore";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";
import { Search, UserPlus, Loader2, Check, MessageCircle, Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import Avatar from "./Avatar";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const { searchUsers, searchResults, isSearching } = useUserStore();
  const { sendFriendRequest, isSendingRequest, friendRequests, getFriendRequests, friends, getFriends } = useFriendStore();
  const { conversations, openDirectChat, openGroupChat } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length > 0) {
        searchUsers(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchUsers]);

  useEffect(() => {
    getFriendRequests();
    getFriends();
  }, [getFriendRequests, getFriends]);

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

  const isFriend = (userId) => {
    return friends.some((friend) => friend._id === userId || friend._id?.toString() === userId?.toString());
  };

  const hasExistingChat = (userId) => {
    return conversations.some(
      (conv) => conv.type === "direct" && (conv.user._id === userId || conv.user._id?.toString() === userId?.toString())
    );
  };

  const getExistingChat = (userId) => {
    return conversations.find(
      (conv) => conv.type === "direct" && (conv.user._id === userId || conv.user._id?.toString() === userId?.toString())
    );
  };

  // Filter search results: exclude already friends, show existing chats instead
  const filteredSearchResults = useMemo(() => {
    if (!query.trim()) return [];
    
    return searchResults.filter((user) => {
      if (user._id === authUser?._id) return false;
      // If already a friend, don't show in search (they'll be in conversations)
      return !isFriend(user._id);
    });
  }, [searchResults, authUser, isFriend]);

  // Filter conversations and groups by search query
  const filteredConversations = useMemo(() => {
    if (!query.trim()) return [];
    
    const normalizedSearch = query.trim().toLowerCase();
    return conversations.filter((conv) => {
      if (conv.type === "group") {
        return conv.group.name?.toLowerCase().includes(normalizedSearch);
      } else {
        const name = conv.user.fullName?.toLowerCase() || "";
        const email = conv.user.email?.toLowerCase() || "";
        return name.includes(normalizedSearch) || email.includes(normalizedSearch);
      }
    });
  }, [conversations, query]);

  const handleOpenChat = (user) => {
    const existingChat = getExistingChat(user._id);
    if (existingChat) {
      openDirectChat(existingChat.user);
    } else {
      openDirectChat(user);
    }
  };

  return (
    <div className="p-3">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/40" />
        <input
          type="text"
          placeholder="Search groups, chats, and friends..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input input-bordered w-full pl-10"
        />
      </div>

      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {!isSearching && query.trim().length > 0 && (
        <div className="space-y-4">
          {/* Existing Conversations and Groups */}
          {filteredConversations.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-zinc-400 mb-2 px-1">Conversations</h3>
              <div className="space-y-1">
                {filteredConversations.map((conv) => {
                  const isGroup = conv.type === "group";
                  return (
                    <button
                      key={isGroup ? `group_${conv.group._id}` : `direct_${conv.user._id}`}
                      onClick={() => {
                        if (isGroup) {
                          openGroupChat(conv.group);
                        } else {
                          openDirectChat(conv.user);
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-base-300 rounded-lg transition-colors text-left"
                    >
                      {isGroup ? (
                        <>
                          <Avatar isGroup={true} group={conv.group} size={40} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{conv.group.name}</div>
                            <div className="text-xs text-zinc-400">Group</div>
                          </div>
                          <Users className="size-4 text-zinc-400 flex-shrink-0" />
                        </>
                      ) : (
                        <>
                          <Avatar user={conv.user} size={40} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{conv.user.fullName}</div>
                            <div className="text-xs text-zinc-400 truncate">{conv.user.email}</div>
                          </div>
                          <MessageCircle className="size-4 text-zinc-400 flex-shrink-0" />
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Users (not friends, no existing chat) */}
          {filteredSearchResults.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-zinc-400 mb-2 px-1">People</h3>
              <div className="space-y-1">
                {filteredSearchResults.map((user) => {
                  const requestSent = isRequestSent(user._id);
                  const hasChat = hasExistingChat(user._id);

                  return (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 p-3 hover:bg-base-300 rounded-lg transition-colors"
                    >
                      <Avatar user={user} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{user.fullName}</div>
                        <div className="text-sm text-zinc-400 truncate">{user.email}</div>
                      </div>
                      {hasChat ? (
                        <button
                          onClick={() => handleOpenChat(user)}
                          className="btn btn-xs btn-ghost"
                          title="Open chat"
                        >
                          <MessageCircle className="size-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user._id)}
                          disabled={isSendingRequest || requestSent}
                          className={`btn btn-xs ${
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
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredConversations.length === 0 && filteredSearchResults.length === 0 && (
            <div className="text-center text-zinc-500 py-4">No results found</div>
          )}
        </div>
      )}

      {query.trim().length === 0 && (
        <div className="text-center text-zinc-500 py-8">
          <Search className="size-8 mx-auto mb-2 opacity-50" />
          <p>Search for groups, chats, and friends</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
