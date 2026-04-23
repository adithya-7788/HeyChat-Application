import { MessageCircle, CircleDashed, PhoneCall, UserPlus, Settings } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useStoryStore } from "../store/useStoryStore";
import { useFriendStore } from "../store/useFriendStore";
import { useEffect } from "react";

const BottomNavBar = ({ activeSection, onChangeSection }) => {
  const { unreadSummary, getUnreadSummary } = useChatStore();
  const { badgeCount, refreshBadge } = useStoryStore();
  const { friendRequests, getFriendRequests } = useFriendStore();

  useEffect(() => {
    getUnreadSummary();
    refreshBadge();
    getFriendRequests();
  }, [getUnreadSummary, refreshBadge, getFriendRequests]);

  const unreadChatsCount = Object.values(unreadSummary || {}).reduce(
    (sum, count) => sum + (count || 0),
    0
  );
  const friendRequestsCount = friendRequests?.received?.length || 0;

  const NavButton = ({ icon: Icon, label, isActive, badge, onClick }) => (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-2 px-1 relative transition-colors ${
        isActive ? "text-primary" : "text-base-content/70 hover:text-base-content"
      }`}
      title={label}
    >
      <div className="relative">
        <Icon className="w-6 h-6" />
        {badge > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-xs text-base-100 flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-base-100 border-t border-base-300 flex items-center justify-around md:hidden z-40">
        <NavButton
          icon={MessageCircle}
          label="Chats"
          isActive={activeSection === "chats"}
          badge={unreadChatsCount}
          onClick={() => {
            onChangeSection("chats");
          }}
        />

        <NavButton
          icon={CircleDashed}
          label="Stories"
          isActive={activeSection === "stories"}
          badge={badgeCount}
          onClick={() => {
            onChangeSection("stories");
          }}
        />

        <NavButton
          icon={PhoneCall}
          label="Calls"
          isActive={activeSection === "calls"}
          badge={0}
          onClick={() => {
            onChangeSection("calls");
          }}
        />

        <NavButton
          icon={UserPlus}
          label="Requests"
          isActive={activeSection === "requests"}
          badge={friendRequestsCount}
          onClick={() => {
            onChangeSection("requests");
          }}
        />

        <NavButton
          icon={Settings}
          label="Settings"
          isActive={activeSection === "settings"}
          badge={0}
          onClick={() => {
            onChangeSection("settings");
          }}
        />
      </nav>
    </>
  );
};

export default BottomNavBar;
