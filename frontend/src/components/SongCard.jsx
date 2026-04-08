import { motion } from "framer-motion";
import { Heart, Play, ThumbsDown } from "lucide-react";

export function SongCard({ song, onPlay, onLike, onDislike }) {
  return (
    <motion.article
      className="glass-card h-full rounded-2xl p-4"
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
    >
      <div className="relative overflow-hidden rounded-xl bg-black/30">
        <img
          src={song?.albumArt || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=500&q=80"}
          alt={song?.title || "Song artwork"}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
        <button
          type="button"
          onClick={() => onPlay?.(song)}
          className="absolute bottom-3 right-3 rounded-full bg-surf p-2 text-white shadow-lg"
        >
          <Play size={16} />
        </button>
      </div>

      <div className="mt-3">
        <h4 className="line-clamp-1 font-display text-lg font-semibold">{song?.title || "Unknown Song"}</h4>
        <p className="line-clamp-1 text-sm text-white/70">{song?.artist || "Unknown Artist"}</p>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-white/60">
        <span className="rounded-full bg-white/10 px-2 py-1">{song?.genre || "Genre"}</span>
        {song?.score !== undefined ? <span>Score {song.score}</span> : <span>Popularity {song?.popularity ?? "-"}</span>}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onLike?.(song)}
          className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
        >
          <Heart size={14} /> Like
        </button>
        <button
          type="button"
          onClick={() => onDislike?.(song)}
          className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
        >
          <ThumbsDown size={14} /> Skip
        </button>
      </div>
    </motion.article>
  );
}
