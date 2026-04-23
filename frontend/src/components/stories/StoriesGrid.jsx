import { useEffect } from "react";
import { useStoryStore } from "../../store/useStoryStore";
import { useAuthStore } from "../../store/useAuthStore";

const Tile = ({ children, onClick, highlighted }) => (
  <button
    onClick={onClick}
    className={`relative w-full aspect-[3/5] rounded-2xl overflow-hidden shadow ${
      highlighted ? "ring-4 ring-white" : "ring-1 ring-base-300"
    }`}
  >
    {children}
  </button>
);

const AddStoryTile = ({ latestUrl, onClick }) => (
  <Tile onClick={onClick} highlighted={false}>
    {latestUrl ? (
      latestUrl.includes("video") ? (
        <video src={latestUrl} className="w-full h-full object-cover" muted />
      ) : (
        <img src={latestUrl} className="w-full h-full object-cover" alt="latest" />
      )
    ) : (
      <div className="w-full h-full bg-base-300" />
    )}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center text-2xl font-bold">+</div>
    </div>
  </Tile>
);

const StoriesGrid = ({ onOpenViewer, onOpenCreator }) => {
  const { feed, isLoading, getFeed } = useStoryStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    getFeed();
  }, [getFeed]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  const myGroup = feed.find((g) => g.owner?._id === authUser?._id);
  const others = feed.filter((g) => g.owner?._id !== authUser?._id);
  const myLatestUrl = myGroup?.latest?.mediaUrl;

  // Sort others: unopened first by latest, then opened by latest
  const unopened = others.filter((g) => g.hasUnopened).sort((a, b) => new Date(b.latest.createdAt) - new Date(a.latest.createdAt));
  const opened = others.filter((g) => !g.hasUnopened).sort((a, b) => new Date(b.latest.createdAt) - new Date(a.latest.createdAt));
  const ordered = [
    ...(myGroup ? [myGroup] : []),
    ...unopened,
    ...opened,
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {/* Add story tile (always first) */}
      <AddStoryTile latestUrl={myLatestUrl} onClick={onOpenCreator} />

      {/* Friend story tiles */}
      {ordered.filter((g) => g.owner?._id !== authUser?._id).map((g) => (
        <Tile
          key={g.owner._id}
          highlighted={g.hasUnopened}
          onClick={() => onOpenViewer(g)}
        >
          {g.latest.mediaType === "video" ? (
            <video src={g.latest.mediaUrl} className="w-full h-full object-cover" muted />
          ) : (
            <img src={g.latest.mediaUrl} className="w-full h-full object-cover" alt={g.owner.fullName} />
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-white text-xs font-medium truncate">{g.owner.fullName}</p>
          </div>
        </Tile>
      ))}
    </div>
  );
};

export default StoriesGrid;
