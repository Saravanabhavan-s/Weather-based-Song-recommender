import { ListMusic, Trash2 } from "lucide-react";

export function PlaylistCard({ playlist, onDelete }) {
  return (
    <article className="glass-card rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-display text-lg font-semibold">{playlist.playlistName}</h4>
          <p className="text-sm text-white/70">
            {playlist.songs?.length || 0} songs • {playlist.mood || "Any mood"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete?.(playlist.id)}
          className="rounded-lg border border-white/20 p-2 text-white/70 hover:bg-white/10"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">
          <ListMusic size={12} /> {playlist.weatherType || "All weather"}
        </span>
        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">
          Created {new Date(playlist.createdAt).toLocaleDateString()}
        </span>
      </div>
    </article>
  );
}
