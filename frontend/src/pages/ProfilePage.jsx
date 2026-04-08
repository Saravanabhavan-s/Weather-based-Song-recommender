import { useEffect, useState } from "react";

import { EmptyState } from "../components/EmptyState";
import { PlaylistCard } from "../components/PlaylistCard";
import { ProfileStats } from "../components/ProfileStats";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { useAuth } from "../hooks/useAuth";
import { playlistService } from "../services/playlistService";
import { userService } from "../services/userService";

export function ProfilePage() {
  const { setUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  const [artistsText, setArtistsText] = useState("");
  const [genresText, setGenresText] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [profileRes, historyRes, playlistsRes] = await Promise.all([
        userService.profile(),
        userService.history(16),
        playlistService.list(),
      ]);

      setProfile(profileRes);
      setHistory(historyRes.items || []);
      setPlaylists(playlistsRes.items || []);
      setArtistsText((profileRes.favoriteArtists || []).join(", "));
      setGenresText((profileRes.favoriteGenres || []).join(", "));
    } catch (err) {
      setError(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const savePreferences = async () => {
    try {
      const updated = await userService.updateProfile({
        favoriteArtists: splitInput(artistsText),
        favoriteGenres: splitInput(genresText),
      });
      setProfile(updated);
      setUser(updated);
      setNotice("Preferences updated.");
    } catch (err) {
      setError(err.message);
    }
  };

  const deletePlaylist = async (playlistId) => {
    try {
      await playlistService.remove(playlistId);
      setPlaylists((prev) => prev.filter((item) => item.id !== playlistId));
      setNotice("Playlist removed.");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        <SkeletonLoader className="h-40" />
        <SkeletonLoader className="h-56" />
        <SkeletonLoader className="h-40" />
      </div>
    );
  }

  if (!profile) {
    return <EmptyState title="Profile unavailable" description="Try refreshing your session." />;
  }

  return (
    <div className="space-y-5">
      {error ? <div className="rounded-xl bg-red-500/15 px-4 py-2 text-sm text-red-200">{error}</div> : null}
      {notice ? <div className="rounded-xl bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100">{notice}</div> : null}

      <ProfileStats profile={profile} historyCount={history.length} />

      <section className="glass-card rounded-2xl p-5">
        <h3 className="font-display text-xl font-semibold">Account settings</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/60">Favorite artists</label>
            <input
              value={artistsText}
              onChange={(event) => setArtistsText(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/60">Favorite genres</label>
            <input
              value={genresText}
              onChange={(event) => setGenresText(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={savePreferences}
          className="mt-4 rounded-xl bg-gradient-to-r from-surf to-sky px-4 py-2 text-sm font-semibold text-white"
        >
          Save changes
        </button>
      </section>

      <section className="glass-card rounded-2xl p-5">
        <h3 className="font-display text-xl font-semibold">Saved playlists</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {playlists.length ? (
            playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} onDelete={deletePlaylist} />
            ))
          ) : (
            <EmptyState
              title="No saved playlists"
              description="Create a playlist from the dashboard recommendation list."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function splitInput(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
