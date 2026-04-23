import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, UserPlus, Settings, MessageSquare } from "lucide-react";
import SearchBar from "./SearchBar";
import FriendRequests from "./FriendRequests";
import Avatar from "./Avatar";

const Sidebar = () => {
  const location = useLocation();
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { getFriends, friends, isFriendsLoading } = useFriendStore();
  const [activeTab, setActiveTab] = useState("friends");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    if (location.pathname === "/" && activeTab === "friends") {
      getFriends();
    }
  }, [activeTab, getFriends, location.pathname]);

  const filteredUsers = showOnlineOnly
    ? friends.filter((user) => onlineUsers.includes(user._id))
    : friends;

  const isHomePage = location.pathname === "/";

  if (!isHomePage) {
    // Navigation sidebar for other pages
    return (
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        <div className="border-b border-base-300 w-full p-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-6" />
            <span className="font-medium hidden lg:block">Navigation</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <Link
            to="/"
            className="w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors"
          >
            <Users className="size-5" />
            <span className="hidden lg:block">Friends</span>
          </Link>
          <Link
            to="/explore"
            className="w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors"
          >
            <Search className="size-5" />
            <span className="hidden lg:block">Explore</span>
          </Link>
          <Link
            to="/settings"
            className="w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors"
          >
            <Settings className="size-5" />
            <span className="hidden lg:block">Settings</span>
          </Link>
        </div>
      </aside>
    );
  }

  // Friends sidebar for home page
  if (isFriendsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Friends</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab("friends")}
            className={`btn btn-xs ${activeTab === "friends" ? "btn-primary" : "btn-ghost"}`}
          >
            <Users className="size-4" />
            <span className="hidden lg:inline ml-1">Friends</span>
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`btn btn-xs ${activeTab === "requests" ? "btn-primary" : "btn-ghost"}`}
          >
            <UserPlus className="size-4" />
            <span className="hidden lg:inline ml-1">Requests</span>
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`btn btn-xs ${activeTab === "search" ? "btn-primary" : "btn-ghost"}`}
          >
            <Search className="size-4" />
            <span className="hidden lg:inline ml-1">Search</span>
          </button>
        </div>

        {/* Online filter toggle */}
        {activeTab === "friends" && (
          <div className="mt-3 hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
          </div>
        )}
      </div>

      <div className="overflow-y-auto w-full py-3">
        {activeTab === "friends" && (
          <>
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <Avatar user={user} size={48} />
                  {onlineUsers.includes(user._id) && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                      rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>

                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-zinc-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center text-zinc-500 py-4">No friends found</div>
            )}
          </>
        )}

        {activeTab === "requests" && <FriendRequests />}

        {activeTab === "search" && <SearchBar />}
      </div>
    </aside>
  );
};
export default Sidebar;
