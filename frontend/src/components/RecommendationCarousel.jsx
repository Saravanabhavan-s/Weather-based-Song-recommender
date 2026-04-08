import { EmptyState } from "./EmptyState";
import { SongCard } from "./SongCard";

export function RecommendationCarousel({
  title,
  songs = [],
  onPlay,
  onLike,
  onDislike,
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">{title}</h3>
        <p className="text-xs text-white/60">{songs.length} tracks</p>
      </div>

      {songs.length === 0 ? (
        <EmptyState title="No songs found" description="Try changing your city, mood, or weather filter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {songs.map((song, index) => (
            <SongCard
              key={song.id || `${song.title}-${song.artist}`}
              song={song}
              onPlay={() => onPlay?.(song, songs, index)}
              onLike={onLike}
              onDislike={onDislike}
            />
          ))}
        </div>
      )}
    </section>
  );
}
