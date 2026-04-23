export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Generate a color based on a string (consistent for same string)
export function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a bright, vibrant color
  const hue = hash % 360;
  const saturation = 65 + (hash % 20); // 65-85% saturation for vibrant colors
  const lightness = 45 + (hash % 15); // 45-60% lightness for good contrast
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Get the first letter of a name
export function getInitial(name) {
  if (!name || name.trim().length === 0) return "?";
  return name.trim().charAt(0).toUpperCase();
}

// Avatar component props helper
export function getAvatarProps(user, name = null) {
  const displayName = name || user?.fullName || user?.name || "User";
  const isDefault = !user?.profilePic;
  
  return {
    src: user?.profilePic || null,
    alt: displayName,
    isDefault,
    initial: getInitial(displayName),
    bgColor: stringToColor(displayName),
  };
}
