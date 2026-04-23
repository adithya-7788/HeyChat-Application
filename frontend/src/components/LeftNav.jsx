import { useEffect } from "react";
import { MessageCircle, UserPlus, Settings, LogOut, PhoneCall, CircleDashed, User } from "lucide-react";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import Avatar from "./Avatar";
import { useStoryStore } from "../store/useStoryStore";

const LeftNav = ({ activeSection, onChangeSection, onOpenSettings, onOpenProfile }) => {
  const { friendRequests, getFriendRequests } = useFriendStore();
  const { unreadSummary, getUnreadSummary } = useChatStore();
  const { logout, authUser } = useAuthStore();
  const { badgeCount, refreshBadge } = useStoryStore();

  useEffect(() => {
    getFriendRequests();
    getUnreadSummary();
    refreshBadge();
  }, [getFriendRequests, getUnreadSummary, refreshBadge]);

  const unreadChatsCount = Object.values(unreadSummary || {}).reduce(
    (sum, count) => sum + (count || 0),
    0
  );

  const friendRequestsCount = friendRequests?.received?.length || 0;

  const NavIconButton = ({ icon: Icon, label, isActive, badge, onClick }) => (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-colors
      ${isActive ? "bg-base-100 text-primary" : "text-base-content/70 hover:bg-base-100/60"}`}
      title={label}
    >
      <Icon className="w-6 h-6" />
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-xs text-base-100 flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );

  return (
    <aside className="h-full w-16 border-r border-base-300 flex flex-col items-center py-4 bg-base-200/60">
      {/* Logo */}
      <div className="mb-6">
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center overflow-hidden">
          <img
            src="/heychat-logo.png"
            alt="HeyChat logo"
            className="w-8 h-8 object-contain"
            onError={(e) => {
              // Fallback to MessageCircle icon if logo not available
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector('.fallback-icon')) {
                const icon = document.createElement('div');
                icon.className = 'fallback-icon text-primary-content';
                icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
                parent.appendChild(icon);
              }
            }}
          />
        </div>
      </div>

      {/* Main nav icons */}
      <div className="flex-1 flex flex-col items-center">
        <NavIconButton
          icon={MessageCircle}
          label="Chats"
          isActive={activeSection === "chats"}
          badge={unreadChatsCount}
          onClick={() => onChangeSection("chats")}
        />

        <NavIconButton
          icon={CircleDashed}
          label="Stories"
          isActive={activeSection === "stories"}
          badge={badgeCount}
          onClick={() => onChangeSection("stories")}
        />

        <NavIconButton
          icon={PhoneCall}
          label="Calls"
          isActive={activeSection === "calls"}
          badge={0}
          onClick={() => onChangeSection("calls")}
        />

        <NavIconButton
          icon={UserPlus}
          label="Friend Requests"
          isActive={activeSection === "requests"}
          badge={friendRequestsCount}
          onClick={() => onChangeSection("requests")}
        />
      </div>

      {/* Bottom settings, profile & logout */}
      <div className="flex flex-col items-center gap-3 mt-4">
        <button
          onClick={onOpenSettings}
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
            activeSection === "settings"
              ? "bg-base-100 text-primary"
              : "text-base-content/70 hover:bg-base-100/60"
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenProfile}
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors overflow-hidden ${
            activeSection === "profile"
              ? "bg-base-100 ring-2 ring-primary"
              : "hover:bg-base-100/60"
          }`}
          title="Profile"
        >
          {authUser ? (
            <Avatar user={authUser} size={40} />
          ) : (
            <User className="w-5 h-5 text-base-content/70" />
          )}
        </button>

        <button
          onClick={logout}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-error hover:bg-base-100/60 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};

export default LeftNav;

