import { useChatStore } from "../store/useChatStore";

import { useEffect, useState } from "react";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import ProfileViewPanel from "../components/ProfileViewPanel";
import LeftNav from "../components/LeftNav";
import ChatsList from "../components/ChatsList";
import FriendRequests from "../components/FriendRequests";
import FriendSuggestions from "../components/requests/FriendSuggestions";
import DisplaySettingsPanel from "../components/settings/DisplaySettingsPanel";
import ProfilePanel from "../components/profile/ProfilePanel";
import CallHistory from "../components/CallHistory";
import CallContainer from "../components/CallContainer";
import BottomNavBar from "../components/BottomNavBar";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useCallStore } from "../store/useCallStore";
import { Search, Users, ArrowLeft, Phone, Video } from "lucide-react";
import Avatar from "../components/Avatar";
import StoriesGrid from "../components/stories/StoriesGrid";
import StoryViewer from "../components/stories/StoryViewer";
import StoryCreator from "../components/stories/StoryCreator";
import { useStoryStore } from "../store/useStoryStore";

const HomePage = () => {
  const { activeConversation, isProfileViewOpen, closeConversation, openGroupChat, closeProfileView } =
    useChatStore();
  const { authUser, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState("chats"); // chats | stories | calls | requests | settings | profile
  const [activeSettingsTab, setActiveSettingsTab] = useState("display"); // display
  const [activeProfileTab, setActiveProfileTab] = useState("account"); // account | friends
  const [chatSearch, setChatSearch] = useState("");
  const [mobileView, setMobileView] = useState("list"); // list | detail (for mobile navigation)
  // Group creation UI state
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const { friends, getFriends } = useFriendStore();
  const { isCallActive, initiateCall, initializeCallListeners, cleanupCallListeners } = useCallStore();
  const { activeOwner, isCreatorOpen, openOwner, openCreator, closeCreator, cleanupStories } = useStoryStore();
  const [callMemberSearch, setCallMemberSearch] = useState("");
  const [selectedCallMembers, setSelectedCallMembers] = useState([]);
  const [selectedCallType, setSelectedCallType] = useState(null); // "audio" | "video" | null

  useEffect(() => {
    if (activeSection === "chats") {
      getFriends();
    }

    // Reset mobileView to list when changing sections or when no active conversation
    const isMobileDevice = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobileDevice && (activeSection !== "chats" || !activeConversation)) {
      setMobileView("list");
    }

    // Discard group draft when navigating away from Chats
    if (activeSection !== "chats") {
      setIsCreatingGroup(false);
      setGroupTitle("");
      setGroupSearch("");
      setSelectedGroupMembers([]);
    }

    // Clean up stories when navigating away from Stories section
    if (activeSection !== "stories") {
      cleanupStories();
    }
    
    // Reset call selection state when navigating away from Calls
    if (activeSection !== "calls") {
      setSelectedCallType(null);
      setSelectedCallMembers([]);
      setCallMemberSearch("");
    }
  }, [activeSection, activeConversation, getFriends, cleanupStories]);

  // Initialize call listeners once on mount
  useEffect(() => {
    initializeCallListeners();
    return () => {
      cleanupCallListeners();
    };
  }, [initializeCallListeners, cleanupCallListeners]);

  const toggleMemberSelection = (friendId) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const normalizedGroupSearch = groupSearch.trim().toLowerCase();
  const filteredGroupFriends = [...friends]
    .filter((friend) => {
      if (!normalizedGroupSearch) return true;
      const name = friend.fullName?.toLowerCase() || "";
      const email = friend.email?.toLowerCase() || "";
      return name.includes(normalizedGroupSearch) || email.includes(normalizedGroupSearch);
    })
    .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

  // Detect if mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="h-screen bg-base-200">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        {/* Left thin navigation column */}
        <LeftNav
          activeSection={activeSection}
          onChangeSection={setActiveSection}
          onOpenSettings={() => setActiveSection("settings")}
          onOpenProfile={() => setActiveSection("profile")}
        />

        {/* Second & third columns */}
        <div className="flex-1 flex">
          {/* Second column */}
          <div className="w-72 border-r border-base-300 bg-base-100 flex flex-col">
            {activeSection === "chats" && !isCreatingGroup && (
              <>
                <div className="px-4 py-3 border-b border-base-300">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">Chats</h2>
                    <button
                      className="btn btn-xs gap-1 btn-ghost"
                      onClick={() => setIsCreatingGroup(true)}
                      title="Create group"
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-xs hidden sm:inline">Create group</span>
                    </button>
                  </div>
                </div>

                {/* Chats search + list */}
                <div className="px-4 pt-3">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/40" />
                    <input
                      type="text"
                      placeholder="Search"
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      className="input input-sm input-bordered w-full pl-10"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <ChatsList searchQuery={chatSearch} />
                </div>
              </>
            )}

            {activeSection === "chats" && isCreatingGroup && (
              <>
                <div className="px-4 py-3 border-b border-base-300">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs p-1"
                      onClick={() => {
                        setIsCreatingGroup(false);
                        setGroupTitle("");
                        setGroupSearch("");
                        setSelectedGroupMembers([]);
                      }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-lg font-semibold">Create group</h2>
                  </div>
                </div>

                <div className="flex-1 flex flex-col px-4 py-3 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Group title</label>
                    <input
                      type="text"
                      className="input input-sm input-bordered w-full"
                      placeholder="Enter group name"
                      value={groupTitle}
                      onChange={(e) => setGroupTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block">Search friends</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-base-content/40" />
                      <input
                        type="text"
                        className="input input-sm input-bordered w-full pl-7"
                        placeholder="Search"
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 rounded-lg border border-base-300 bg-base-100 overflow-y-auto">
                    {filteredGroupFriends.length === 0 ? (
                      <div className="py-3 text-center text-xs text-base-content/60">
                        No friends to add
                      </div>
                    ) : (
                      filteredGroupFriends.map((friend) => {
                        const isSelected = selectedGroupMembers.includes(friend._id);
                        return (
                          <button
                            key={friend._id}
                            type="button"
                            onClick={() => toggleMemberSelection(friend._id)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-base-200 ${
                              isSelected ? "bg-base-200" : ""
                            }`}
                          >
                            <span className="inline-flex items-center justify-center size-4 rounded border border-base-300 mr-1">
                              {isSelected && <span className="w-2 h-2 rounded bg-primary" />}
                            </span>
                            <Avatar user={friend} size={24} />
                            <span className="truncate flex-1">{friend.fullName}</span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-primary mt-2"
                    disabled={!groupTitle.trim() || selectedGroupMembers.length === 0}
                    onClick={async () => {
                      try {
                        const { axiosInstance } = await import("../lib/axios");
                        const res = await axiosInstance.post("/groups", {
                          name: groupTitle.trim(),
                          memberIds: selectedGroupMembers,
                        });
                        const group = res.data;
                        setIsCreatingGroup(false);
                        setGroupTitle("");
                        setGroupSearch("");
                        setSelectedGroupMembers([]);
                        openGroupChat(group);
                      } catch (error) {
                        console.error("Error creating group", error);
                        const { default: toast } = await import("react-hot-toast");
                        toast.error(error.response?.data?.message || "Failed to create group");
                      }
                    }}
                  >
                    Create Group
                  </button>
                </div>
              </>
            )}

            {activeSection === "stories" && (
              <>
                <div className="px-4 py-3 border-b border-base-300">
                  <h2 className="text-lg font-semibold">Stories</h2>
                  <p className="text-xs text-base-content/60">
                    View recent stories and share what&apos;s new
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <StoriesGrid
                    onOpenViewer={(group) => openOwner(group)}
                    onOpenCreator={openCreator}
                  />
                </div>
              </>
            )}

            {activeSection === "calls" && (
              <>
                <div className="px-4 py-3 border-b border-base-300">
                  <h2 className="text-lg font-semibold">Calls</h2>
                  <p className="text-xs text-base-content/60">
                    See your recent audio and video calls
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <CallHistory />
                </div>
              </>
            )}

            {activeSection === "requests" && (
              <>
                <div className="px-4 py-3 border-b border-base-300">
                  <h2 className="text-lg font-semibold">Friend Requests</h2>
                  <p className="text-xs text-base-content/60">
                    View requests you&apos;ve received and sent
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <FriendRequests />
                </div>
              </>
            )}

            {activeSection === "settings" && (
              <>
                <div className="px-4 py-3 border-b border-base-300">
                  <h2 className="text-lg font-semibold">Settings</h2>
                  <p className="text-xs text-base-content/60">Manage HeyChat</p>
                </div>
                <div className="flex-1 flex flex-col">
                  <button
                    className={`w-full text-left px-4 py-3 text-sm border-b border-base-300 ${
                      activeSettingsTab === "display"
                        ? "bg-base-200 font-medium"
                        : "hover:bg-base-200/60"
                    }`}
                    onClick={() => setActiveSettingsTab("display")}
                  >
                    Display
                  </button>
                </div>
              </>
            )}

            {activeSection === "profile" && (
              <>
                <div className="px-4 py-3 border-b border-base-300">
                  <h2 className="text-lg font-semibold">Profile</h2>
                  <p className="text-xs text-base-content/60">Your profile information</p>
                </div>
                <div className="flex-1 flex flex-col">
                  <button
                    className={`w-full text-left px-4 py-3 text-sm border-b border-base-300 ${
                      activeProfileTab === "account"
                        ? "bg-base-200 font-medium"
                        : "hover:bg-base-200/60"
                    }`}
                    onClick={() => setActiveProfileTab("account")}
                  >
                    Account
                  </button>
                  <button
                    className={`w-full text-left px-4 py-3 text-sm border-b border-base-300 ${
                      activeProfileTab === "friends"
                        ? "bg-base-200 font-medium"
                        : "hover:bg-base-200/60"
                    }`}
                    onClick={() => setActiveProfileTab("friends")}
                  >
                    Friends
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Third column */}
          <div className="flex-1 flex flex-col">
            {isCallActive ? (
              <CallContainer />
            ) : (
              <>
                {activeSection === "chats" && !activeConversation && <NoChatSelected />}
                {activeSection === "chats" && activeConversation && !isProfileViewOpen && (
                  <ChatContainer />
                )}
                {activeSection === "chats" && activeConversation && isProfileViewOpen && (
                  <ProfileViewPanel
                    conversation={activeConversation}
                    onBack={closeProfileView}
                  />
                )}
              </>
            )}

            {activeSection === "stories" && (
              <>
                {isCreatorOpen ? (
                  <StoryCreator />
                ) : activeOwner ? (
                  <StoryViewer group={activeOwner} isMobile={false} />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-base-content/60">
                    Select a story from the middle panel to view it here.
                  </div>
                )}
              </>
            )}

            {activeSection === "calls" && (
              <div className="flex-1 flex flex-col">
                {isCallActive ? null : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Start a Call</h3>
                      <p className="text-sm text-base-content/60 mb-6">
                        Select a call type and choose participants
                      </p>
                    </div>

                    {/* Call type buttons */}
                    {!selectedCallType && (
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            setSelectedCallType("audio");
                            setSelectedCallMembers([]);
                            setCallMemberSearch("");
                          }}
                          className="btn btn-circle btn-lg btn-primary"
                          title="Audio Call"
                        >
                          <Phone className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCallType("video");
                            setSelectedCallMembers([]);
                            setCallMemberSearch("");
                          }}
                          className="btn btn-circle btn-lg btn-primary"
                          title="Video Call"
                        >
                          <Video className="w-6 h-6" />
                        </button>
                      </div>
                    )}

                    {/* Member selection */}
                    {selectedCallType && (
                      <div className="w-full max-w-md">
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/40" />
                          <input
                            type="text"
                            placeholder="Search friends to call"
                            value={callMemberSearch}
                            onChange={(e) => setCallMemberSearch(e.target.value)}
                            className="input input-sm input-bordered w-full pl-10"
                          />
                        </div>

                        <div className="mb-4 flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCallType(null);
                              setSelectedCallMembers([]);
                              setCallMemberSearch("");
                            }}
                            className="btn btn-ghost btn-xs"
                          >
                            ← Back
                          </button>
                          <span className="text-sm font-medium">
                            Select {selectedCallType === "video" ? "Video" : "Audio"} Call Participants
                          </span>
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {friends
                            .filter((friend) => {
                              if (!callMemberSearch.trim()) return true;
                              const name = friend.fullName?.toLowerCase() || "";
                              const email = friend.email?.toLowerCase() || "";
                              return name.includes(callMemberSearch.toLowerCase()) || email.includes(callMemberSearch.toLowerCase());
                            })
                            .map((friend) => (
                              <button
                                key={friend._id}
                                onClick={() => {
                                  if (selectedCallMembers.includes(friend._id)) {
                                    setSelectedCallMembers((prev) => prev.filter((id) => id !== friend._id));
                                  } else {
                                    setSelectedCallMembers((prev) => [...prev, friend._id]);
                                  }
                                }}
                                className={`w-full p-2 flex items-center gap-2 hover:bg-base-200 rounded ${
                                  selectedCallMembers.includes(friend._id) ? "bg-base-200" : ""
                                }`}
                              >
                                <Avatar user={friend} size={32} />
                                <span className="text-sm">{friend.fullName}</span>
                              </button>
                            ))}
                        </div>

                        {selectedCallMembers.length > 0 && (
                          <div className="mt-4">
                            <button
                              onClick={async () => {
                                if (selectedCallMembers.length === 0) return;
                                const chatId = selectedCallMembers[0]; // For direct call, use first participant
                                await initiateCall(chatId, "direct", selectedCallType, selectedCallMembers);
                                setSelectedCallMembers([]);
                                setCallMemberSearch("");
                                setSelectedCallType(null);
                              }}
                              className="btn btn-primary btn-sm w-full gap-2"
                            >
                              {selectedCallType === "video" ? (
                                <>
                                  <Video className="w-4 h-4" />
                                  Start Video Call
                                </>
                              ) : (
                                <>
                                  <Phone className="w-4 h-4" />
                                  Start Audio Call
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeSection === "requests" && (
              <FriendSuggestions />
            )}

            {activeSection === "settings" && (
              <div className="h-full overflow-hidden">
                {activeSettingsTab === "display" && <DisplaySettingsPanel />}
              </div>
            )}

            {activeSection === "profile" && (
              <div className="h-full overflow-hidden">
                {activeProfileTab === "account" && authUser && <ProfilePanel profileTab="account" />}
                {activeProfileTab === "friends" && authUser && <ProfilePanel profileTab="friends" />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className={`md:hidden h-screen flex flex-col bg-base-100 ${mobileView === "list" ? "pb-20" : ""}`}>
        {isCallActive && <CallContainer />}

        {!isCallActive && activeSection === "chats" && mobileView === "list" && (
          <>
            <div className="px-4 py-3 border-b border-base-300">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Chats</h2>
                <button
                  className="btn btn-xs gap-1 btn-ghost"
                  onClick={() => setIsCreatingGroup(true)}
                  title="Create group"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="input input-sm input-bordered w-full pl-10"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatsList
                searchQuery={chatSearch}
                onSelectChat={() => setMobileView("detail")}
              />
            </div>
          </>
        )}

        {!isCallActive && activeSection === "chats" && mobileView === "detail" && activeConversation && (
          <>
            {!isProfileViewOpen && <ChatContainer onBack={() => { setMobileView("list"); closeConversation(); }} />}
            {isProfileViewOpen && (
              <ProfileViewPanel
                conversation={activeConversation}
                onBack={closeProfileView}
              />
            )}
          </>
        )}

        {!isCallActive && activeSection === "chats" && isCreatingGroup && (
          <>
            <div className="px-4 py-3 border-b border-base-300 flex items-center gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-xs p-1"
                onClick={() => {
                  setIsCreatingGroup(false);
                  setGroupTitle("");
                  setGroupSearch("");
                  setSelectedGroupMembers([]);
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-semibold">Create Group</h2>
            </div>
            <div className="flex-1 flex flex-col px-4 py-3 gap-3 overflow-y-auto">
              <input
                type="text"
                className="input input-sm input-bordered w-full"
                placeholder="Group name"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
              />
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-base-content/40" />
                <input
                  type="text"
                  className="input input-sm input-bordered w-full pl-7"
                  placeholder="Search friends"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                />
              </div>
              <div className="flex-1 min-h-0 rounded-lg border border-base-300 bg-base-100 overflow-y-auto">
                {filteredGroupFriends.length === 0 ? (
                  <div className="py-3 text-center text-xs text-base-content/60">No friends</div>
                ) : (
                  filteredGroupFriends.map((friend) => (
                    <button
                      key={friend._id}
                      onClick={() => toggleMemberSelection(friend._id)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-base-200 ${
                        selectedGroupMembers.includes(friend._id) ? "bg-base-200" : ""
                      }`}
                    >
                      <span className="inline-flex items-center justify-center size-4 rounded border border-base-300">
                        {selectedGroupMembers.includes(friend._id) && (
                          <span className="w-2 h-2 rounded bg-primary" />
                        )}
                      </span>
                      <Avatar user={friend} size={24} />
                      <span className="truncate flex-1">{friend.fullName}</span>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={!groupTitle.trim() || selectedGroupMembers.length === 0}
                onClick={async () => {
                  try {
                    const { axiosInstance } = await import("../lib/axios");
                    const res = await axiosInstance.post("/groups", {
                      name: groupTitle.trim(),
                      memberIds: selectedGroupMembers,
                    });
                    const group = res.data;
                    setIsCreatingGroup(false);
                    setGroupTitle("");
                    setGroupSearch("");
                    setSelectedGroupMembers([]);
                    openGroupChat(group);
                    setMobileView("detail");
                  } catch (error) {
                    console.error("Error creating group", error);
                  }
                }}
              >
                Create
              </button>
            </div>
          </>
        )}

        {!isCallActive && activeSection === "stories" && mobileView === "list" && (
          <>
            <div className="px-4 py-3 border-b border-base-300">
              <h2 className="text-lg font-semibold">Stories</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <StoriesGrid
                onOpenViewer={(group) => {
                  openOwner(group);
                  setMobileView("detail");
                }}
                onOpenCreator={() => {
                  openCreator();
                  setMobileView("detail");
                }}
              />
            </div>
          </>
        )}

        {!isCallActive && activeSection === "stories" && mobileView === "detail" && activeOwner && (
          <>
            <div className="px-4 py-3 border-b border-base-300 flex items-center gap-2">
              <button
                onClick={() => {
                  setMobileView("list");
                  cleanupStories();
                }}
                className="btn btn-ghost btn-xs p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-semibold">Story</h2>
            </div>
            <StoryViewer 
              group={activeOwner} 
              isMobile={true}
              onClose={() => {
                setMobileView("list");
                cleanupStories();
              }}
            />
          </>
        )}

        {!isCallActive && activeSection === "stories" && mobileView === "detail" && isCreatorOpen && (
          <>
            <div className="px-4 py-3 border-b border-base-300 flex items-center gap-2">
              <button
                onClick={() => {
                  setMobileView("list");
                  closeCreator();
                }}
                className="btn btn-ghost btn-xs p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-semibold">Create Story</h2>
            </div>
            <StoryCreator />
          </>
        )}

        {!isCallActive && activeSection === "calls" && (
          <>
            <div className="px-4 py-3 border-b border-base-300">
              <h2 className="text-lg font-semibold">Calls</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CallHistory />
            </div>
          </>
        )}

        {!isCallActive && activeSection === "requests" && (
          <>
            <div className="px-4 py-3 border-b border-base-300">
              <h2 className="text-lg font-semibold">Friend Requests</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FriendRequests />
              <div className="px-4 py-3 border-t border-base-300">
                <FriendSuggestions />
              </div>
            </div>
          </>
        )}

        {!isCallActive && activeSection === "settings" && mobileView === "list" && (
          <>
            <div className="px-4 py-3 border-b border-base-300">
              <h2 className="text-lg font-semibold">Settings</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              <button
                onClick={() => {
                  setActiveProfileTab("account");
                  setMobileView("detail");
                }}
                className="w-full text-left px-4 py-3 text-sm border border-base-300 rounded-lg hover:bg-base-200 transition-colors"
              >
                Account
              </button>
              <button
                onClick={() => {
                  setActiveProfileTab("friends");
                  setMobileView("detail");
                }}
                className="w-full text-left px-4 py-3 text-sm border border-base-300 rounded-lg hover:bg-base-200 transition-colors"
              >
                Friends
              </button>
              <button
                onClick={() => logout()}
                className="w-full text-left px-4 py-3 text-sm border border-error text-error rounded-lg hover:bg-error/10 transition-colors"
              >
                Logout
              </button>
            </div>
          </>
        )}

        {!isCallActive && activeSection === "settings" && mobileView === "detail" && activeProfileTab === "account" && (
          <>
            <div className="px-4 py-3 border-b border-base-300 flex items-center gap-2">
              <button
                onClick={() => setMobileView("list")}
                className="btn btn-ghost btn-xs p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-semibold">Account</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {authUser && <ProfilePanel profileTab="account" />}
            </div>
          </>
        )}

        {!isCallActive && activeSection === "settings" && mobileView === "detail" && activeProfileTab === "friends" && (
          <>
            <div className="px-4 py-3 border-b border-base-300 flex items-center gap-2">
              <button
                onClick={() => setMobileView("list")}
                className="btn btn-ghost btn-xs p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-semibold">Friends</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {authUser && <ProfilePanel profileTab="friends" />}
            </div>
          </>
        )}

        {/* Mobile Bottom Navigation - hide when in detail view */}
        {mobileView === "list" && (
          <BottomNavBar activeSection={activeSection} onChangeSection={setActiveSection} />
        )}
      </div>
    </div>
  );
};

export default HomePage;
