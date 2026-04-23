import { useEffect, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { formatMessageTime } from "../lib/utils";
import Avatar from "./Avatar";
import { BellOff } from "lucide-react";

const ChatsList = ({ searchQuery, onSelectChat }) => {
  const {
    activeConversation,
    openDirectChat,
    openGroupChat,
    conversations,
    getConversations,
    isConversationsLoading,
    unreadSummary,
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { friends, getFriends } = useFriendStore();

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  // Get all conversation user IDs
  const conversationUserIds = useMemo(() => {
    return new Set(
      conversations
        .filter((conv) => conv.type === "direct")
        .map((conv) => conv.user._id)
    );
  }, [conversations]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (normalizedSearch.length === 0) return conversations;
    
    return conversations.filter((conv) => {
      if (conv.type === "group") {
        return conv.group.name?.toLowerCase().includes(normalizedSearch);
      } else {
        const name = conv.user.fullName?.toLowerCase() || "";
        const email = conv.user.email?.toLowerCase() || "";
        return name.includes(normalizedSearch) || email.includes(normalizedSearch);
      }
    });
  }, [conversations, normalizedSearch]);

  // Filter friends who don't have conversations yet (only when searching)
  const filteredFriendsWithoutChats = useMemo(() => {
    if (normalizedSearch.length === 0) return [];
    
    return friends.filter((friend) => {
      // Only show friends who don't have a conversation
      if (conversationUserIds.has(friend._id)) return false;
      
      const name = friend.fullName?.toLowerCase() || "";
      const email = friend.email?.toLowerCase() || "";
      return name.includes(normalizedSearch) || email.includes(normalizedSearch);
    });
  }, [friends, normalizedSearch, conversationUserIds]);

  if (isConversationsLoading) return <SidebarSkeleton />;

  const getUnreadCount = (conv) => {
    if (conv.type === "direct") {
      return unreadSummary[conv.user._id] || 0;
    } else {
      return unreadSummary[`group_${conv.group._id}`] || 0;
    }
  };

  const isMuted = (conv) => {
    if (!authUser?.mutedChats) return false;
    if (conv.type === "direct") {
      return authUser.mutedChats.includes(conv.user._id);
    } else {
      return authUser.mutedChats.includes(`group_${conv.group._id}`);
    }
  };

  return (
    <div className="overflow-y-auto w-full py-3">
      {filteredConversations.length === 0 && filteredFriendsWithoutChats.length === 0 ? (
        <div className="text-center text-zinc-500 py-6 text-sm">
          {normalizedSearch.length === 0 ? "No conversations found" : "No results found"}
        </div>
      ) : (
        <>
          {/* Show conversations */}
          {filteredConversations.map((conv) => {
          const isActive =
            (conv.type === "group" &&
              activeConversation?.type === "group" &&
              activeConversation.group._id === conv.group._id) ||
            (conv.type === "direct" &&
              activeConversation?.type === "direct" &&
              activeConversation.user._id === conv.user._id);

          const unreadCount = getUnreadCount(conv);
          const isMutedChat = isMuted(conv);
          const isOnline = conv.type === "direct" && onlineUsers.includes(conv.user._id);

          return (
            <button
              key={conv.type === "group" ? `group_${conv.group._id}` : `direct_${conv.user._id}`}
              onClick={() => {
                if (conv.type === "group") {
                  openGroupChat(conv.group);
                } else {
                  openDirectChat(conv.user);
                }
                onSelectChat?.();
              }}
              className={`
                w-full px-3 py-2.5 flex items-center gap-3
                hover:bg-base-200 transition-colors
                ${isActive ? "bg-base-200 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative">
                {conv.type === "group" ? (
                  <Avatar isGroup={true} group={conv.group} size={40} />
                ) : (
                  <>
                    <Avatar user={conv.user} size={40} />
                    {isOnline && (
                      <span
                        className="absolute bottom-0 right-0 size-2.5 bg-green-500 
                        rounded-full ring-2 ring-base-100"
                      />
                    )}
                  </>
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate text-sm">
                  {conv.type === "group" ? conv.group.name : conv.user.fullName}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {conv.type === "group" ? (
                    conv.latestMessage ? (
                      conv.latestMessage.text || "Media"
                    ) : (
                      `${conv.group.members?.length || 0} members`
                    )
                  ) : (
                    isOnline ? "Online" : "Offline"
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center gap-1">
                {isMutedChat ? (
                  <BellOff className="w-4 h-4 text-base-content/40" />
                ) : (
                  unreadCount > 0 && (
                    <span className="badge badge-primary badge-sm">{unreadCount}</span>
                  )
                )}
              </div>
            </button>
          );
        })}

          {/* Show friends without conversations (only when searching) */}
          {filteredFriendsWithoutChats.length > 0 && (
            <>
              {normalizedSearch.length > 0 && filteredConversations.length > 0 && (
                <div className="px-3 py-2 text-xs font-medium text-zinc-400 border-t border-base-300 mt-2">
                  Friends
                </div>
              )}
              {filteredFriendsWithoutChats.map((friend) => {
                const isOnline = onlineUsers.includes(friend._id);
                const isActive =
                  activeConversation?.type === "direct" &&
                  activeConversation.user._id === friend._id;

                return (
                  <button
                    key={`friend_${friend._id}`}
                    onClick={() => openDirectChat(friend)}
                    className={`
                      w-full px-3 py-2.5 flex items-center gap-3
                      hover:bg-base-200 transition-colors
                      ${isActive ? "bg-base-200 ring-1 ring-base-300" : ""}
                    `}
                  >
                    <div className="relative">
                      <Avatar user={friend} size={40} />
                      {isOnline && (
                        <span
                          className="absolute bottom-0 right-0 size-2.5 bg-green-500 
                          rounded-full ring-2 ring-base-100"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium truncate text-sm">{friend.fullName}</div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {isOnline ? "Online" : "Offline"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChatsList;

