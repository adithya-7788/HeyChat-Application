import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useFriendStore } from "../../store/useFriendStore";
import { Camera, Mail, User } from "lucide-react";
import Avatar from "../Avatar";

const ProfilePanel = ({ profileTab = "account" }) => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const { friends, getFriends, isFriendsLoading } = useFriendStore();
  const [selectedImg, setSelectedImg] = useState(null);

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  // Account tab view
  if (profileTab === "account") {
    return (
      <div className="h-full p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto bg-base-300 rounded-xl p-6 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar 
                user={{ ...authUser, profilePic: selectedImg || authUser.profilePic }} 
                size={128} 
                showBorder
              />
              <label
                htmlFor="avatar-upload-inline"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload-inline"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.fullName}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
            </div>
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6 border border-zinc-700/60">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Friends</span>
                <span>{friends.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Friends tab view
  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto bg-base-300 rounded-xl p-6">
        <h2 className="text-lg font-medium mb-4">Friends ({friends.length})</h2>
        {isFriendsLoading ? (
          <div className="text-center text-sm text-base-content/60 py-4">Loading friends...</div>
        ) : friends.length === 0 ? (
          <div className="text-center text-sm text-base-content/60 py-4">No friends yet</div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="flex items-center gap-3 p-3 rounded-lg bg-base-200 hover:bg-base-100 transition-colors"
              >
                <Avatar user={friend} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{friend.fullName}</div>
                  <div className="text-xs text-base-content/60 truncate">{friend.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePanel;
