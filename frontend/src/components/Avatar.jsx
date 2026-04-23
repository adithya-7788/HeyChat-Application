import { useState } from "react";
import { getAvatarProps, getInitial, stringToColor } from "../lib/utils";

const Avatar = ({ user, name, className = "", size = 40, showBorder = false, isGroup = false, group = null }) => {
  const [useDefault, setUseDefault] = useState(false);
  
  // For groups, use group name and create group-specific props
  if (isGroup && group) {
    const groupName = group.name || "Group";
    const groupInitial = getInitial(groupName);
    const groupBgColor = stringToColor(groupName);

    if (group.profilePic) {
      return (
        <img
          src={group.profilePic}
          alt={groupName}
          className={`rounded-full object-cover ${className} ${
            showBorder ? "border-2 border-base-300" : ""
          }`}
          style={{ width: `${size}px`, height: `${size}px` }}
          title={groupName}
        />
      );
    }

    return (
      <div
        className={`rounded-full flex items-center justify-center text-white font-semibold relative ${className} ${
          showBorder ? "border-2 border-base-300" : ""
        }`}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          backgroundColor: groupBgColor,
          boxShadow: "inset 0 0 0 1.5px white"
        }}
        title={groupName}
      >
        <span style={{ fontSize: `${size * 0.4}px` }}>{groupInitial}</span>
      </div>
    );
  }
  
  // For users, use existing logic
  const props = getAvatarProps(user, name);

  // Always render default if no profilePic or if image failed to load
  if (props.isDefault || useDefault) {
    return (
      <div
        className={`rounded-full flex items-center justify-center text-white font-semibold ${className} ${
          showBorder ? "border-2 border-base-300" : ""
        }`}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          backgroundColor: props.bgColor 
        }}
        title={props.alt}
      >
        <span style={{ fontSize: `${size * 0.4}px` }}>{props.initial}</span>
      </div>
    );
  }

  // Render user's uploaded avatar with fallback
  return (
    <img
      src={props.src}
      alt={props.alt}
      className={`rounded-full object-cover ${className} ${
        showBorder ? "border-2 border-base-300" : ""
      }`}
      style={{ width: `${size}px`, height: `${size}px` }}
      title={props.alt}
      onError={() => setUseDefault(true)}
    />
  );
};

export default Avatar;
