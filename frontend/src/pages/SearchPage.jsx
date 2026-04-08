import { Loader2, Search } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "../components/EmptyState";
import { FloatingMusicPlayer } from "../components/FloatingMusicPlayer";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { SongCard } from "../components/SongCard";
import { searchTracks } from "../services/jamendo";
import { songService } from "../services/songService";
import { userService } from "../services/userService";

function normalizeLocalSong(song) {
  return {
    ...song,
    source: song?.source || "local",
    audio: song?.audio || song?.soundcloudUrl || "",
    soundcloudUrl: song?.soundcloudUrl || song?.audio || "",
    moods: Array.isArray(song?.moods) ? song.moods : [],
    weatherTags: Array.isArray(song?.weatherTags) ? song.weatherTags : [],
    timeTags: Array.isArray(song?.timeTags) ? song.timeTags : [],
  };
}

function normalizeExternalTrack(track) {
  const source = track?.source || "external";
  const externalId = String(track?.id || "");

  return {
    id: `${source}-${externalId}`,
    externalId,
    title: track?.name || "Unknown Song",
    artist: track?.artist || "Unknown Artist",
    album: track?.album,
    albumArt: track?.image,
    audio: track?.audio,
    soundcloudUrl: track?.audio,
    duration: track?.duration,
    source,
    moods: [],
    weatherTags: [],
    timeTags: [],
  };
}

function dedupeSongs(items) {
  const seen = new Set();
  const output = [];

  for (const song of items) {
    const key = String(song?.id || `${song?.source}-${song?.title}-${song?.artist}`);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(song);
  }

  return output;
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [results, setResults] = useState([]);

  const [activeSong, setActiveSong] = useState(null);
  const [playQueue, setPlayQueue] = useState([]);

  const runSearch = async (event) => {
    event.preventDefault();

    const term = query.trim();
    if (!term) {
      setError("Type a song, artist, or album to search.");
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const [localResponse, externalTracks] = await Promise.all([
        songService.search(term, 40).catch(() => ({ items: [] })),
        searchTracks(term),
      ]);

      const localSongs = (localResponse?.items || []).map(normalizeLocalSong);
      const streamSongs = (externalTracks || []).map(normalizeExternalTrack);
      const merged = dedupeSongs([...localSongs, ...streamSongs]);

      setResults(merged);
      setPlayQueue(merged);
      setActiveSong(merged[0] || null);

      if (merged.length) {
        setNotice(`Found ${merged.length} songs.`);
      } else {
        setError("No songs found for your search.");
      }
    } catch (err) {
      setError(err.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const onPlaySong = (song, sourceSongs = [], index = 0) => {
    const queue = Array.isArray(sourceSongs) && sourceSongs.length ? sourceSongs : results;
    setPlayQueue(queue);
    setActiveSong(queue[index] || song);
  };

  const onSelectSongFromQueue = (song, queueItems = [], index = 0) => {
    const queue = Array.isArray(queueItems) && queueItems.length ? queueItems : playQueue;
    if (queue.length) {
      setPlayQueue(queue);
      setActiveSong(queue[index] || song);
      return;
    }
    setActiveSong(song);
  };

  const onLike = async (song) => {
    try {
      await userService.likeSong(song);
      setNotice(`Liked ${song?.title || song?.name || "song"}`);
    } catch (err) {
      setError(err.message || "Could not like song.");
    }
  };

  const onDislike = async (song) => {
    try {
      await userService.dislikeSong(song);
      setNotice(`Skipped ${song?.title || song?.name || "song"}`);
    } catch (err) {
      setError(err.message || "Could not skip song.");
    }
  };

  return (
    <div className="space-y-5 pb-56 sm:pb-44 lg:pb-28">
      <section className="glass-card rounded-2xl p-5 sm:p-6">
        <h1 className="font-display text-2xl font-bold">Song Search</h1>
        <p className="mt-1 text-sm text-white/70">Search tracks by song name, artist, or album and listen instantly.</p>

        <form onSubmit={runSearch} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/55" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search songs, artists, albums..."
              className="w-full rounded-xl border border-white/15 bg-black/25 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-sky/60"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-surf to-sky px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </section>

      {error ? <div className="rounded-xl bg-red-500/15 px-4 py-2 text-sm text-red-200">{error}</div> : null}
      {notice ? <div className="rounded-xl bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100">{notice}</div> : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SkeletonLoader className="h-72" />
          <SkeletonLoader className="h-72" />
          <SkeletonLoader className="h-72" />
        </div>
      ) : results.length ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold">Search Results</h3>
            <p className="text-xs text-white/60">{results.length} tracks</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((song, index) => (
              <SongCard
                key={song.id || `${song.title}-${song.artist}`}
                song={song}
                onPlay={() => onPlaySong(song, results, index)}
                onLike={onLike}
                onDislike={onDislike}
              />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState title="Search for songs" description="Start by entering a song title, artist, or album above." />
      )}

      <FloatingMusicPlayer
        song={activeSong}
        queue={playQueue}
        onSelectSong={onSelectSongFromQueue}
        weatherType="clear"
      />
    </div>
  );
}
