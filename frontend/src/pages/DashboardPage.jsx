import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "../components/EmptyState";
import { FloatingMusicPlayer } from "../components/FloatingMusicPlayer";
import { MoodCard } from "../components/MoodCard";
import { RecommendationCarousel } from "../components/RecommendationCarousel";
import { SearchBar } from "../components/SearchBar";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { WeatherCard } from "../components/WeatherCard";
import { getTracksByMood, searchTracks } from "../services/jamendo";
import { playlistService } from "../services/playlistService";
import { recommendationService } from "../services/recommendationService";
import { userService } from "../services/userService";

const JAMENDO_MOOD_BY_WEATHER = {
  rain: "rainy",
  clear: "happy",
  cloud: "chill",
  mist: "chill",
  snow: "chill",
  thunder: "energetic",
};

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

function toJamendoMood(weatherCondition, fallbackMood = "happy") {
  const weatherKey = String(weatherCondition || "").toLowerCase();
  const mood = JAMENDO_MOOD_BY_WEATHER[weatherKey] || String(fallbackMood || "happy").toLowerCase();
  return mood;
}

function normalizeExternalTrack(track, mood, weatherCondition) {
  const source = track.source || "external";
  const externalId = String(track.id);

  return {
    id: `${source}-${externalId}`,
    externalId,
    title: track.name,
    artist: track.artist,
    album: track.album,
    albumArt: track.image,
    audio: track.audio,
    soundcloudUrl: track.audio,
    duration: track.duration,
    moods: [mood],
    weatherTags: [weatherCondition],
    source,
  };
}

async function fetchJamendoRecommendations({ mood, fallbackQuery, weatherCondition }) {
  const byMood = await getTracksByMood(mood);
  const tracks = byMood.length ? byMood : await searchTracks(fallbackQuery || mood || "music");
  return tracks.map((track) => normalizeExternalTrack(track, mood, weatherCondition));
}

function toPlaylistSongItem(song) {
  return {
    songId: String(song?.id || ""),
    song: {
      externalId: song?.externalId ? String(song.externalId) : undefined,
      source: song?.source,
      title: song?.title || song?.name || "Unknown title",
      artist: song?.artist || "Unknown artist",
      album: song?.album,
      albumArt: song?.albumArt,
      audio: song?.audio,
      soundcloudUrl: song?.soundcloudUrl || song?.audio,
      moods: Array.isArray(song?.moods) ? song.moods : [],
      weatherTags: Array.isArray(song?.weatherTags) ? song.weatherTags : [],
      timeTags: Array.isArray(song?.timeTags) ? song.timeTags : [],
      duration: Number.isFinite(song?.duration) ? song.duration : undefined,
    },
  };
}

function broadcastDashboardWeather(weatherType) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("vibecast:dashboard-weather", {
      detail: { weatherType: weatherType || "clear" },
    })
  );
}

export function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [weatherData, setWeatherData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [moodSongs, setMoodSongs] = useState([]);
  const [historySongs, setHistorySongs] = useState([]);
  const [activeSong, setActiveSong] = useState(null);
  const [playQueue, setPlayQueue] = useState([]);
  const [detectedMood, setDetectedMood] = useState("happy");
  const [timeOfDay, setTimeOfDay] = useState("evening");

  const loadWeatherRecommendations = async (params, fallbackQuery) => {
    const data = await recommendationService.weather({ ...params, limit: 12 });
    const weatherCondition = data?.weather?.condition || "clear";
    const moodForTracks = toJamendoMood(weatherCondition, data?.mood || "happy");

    const externalTracks = await fetchJamendoRecommendations({
      mood: moodForTracks,
      fallbackQuery: fallbackQuery || data?.weather?.city || moodForTracks,
      weatherCondition,
    });

    const dbTracks = Array.isArray(data?.recommendations) ? data.recommendations : [];
    const tracks = externalTracks.length ? externalTracks : dbTracks;

    return { data, tracks, moodForTracks };
  };

  const loadSupportData = async () => {
    try {
      const [trendingRes, moodRes, historyRes] = await Promise.all([
        recommendationService.trending(9),
        recommendationService.byMood("romantic", 9),
        userService.history(8),
      ]);

      const trendingItems = Array.isArray(trendingRes?.items) ? trendingRes.items : [];
      const moodItems = Array.isArray(moodRes?.items) ? moodRes.items : [];

      const [fallbackTrending, fallbackMood] = await Promise.all([
        trendingItems.length ? Promise.resolve([]) : searchTracks("top hits"),
        moodItems.length ? Promise.resolve([]) : getTracksByMood("romantic"),
      ]);

      const trendingFallbackNormalized = fallbackTrending.map((track) =>
        normalizeExternalTrack(track, "happy", "clear")
      );
      const moodFallbackNormalized = fallbackMood.map((track) =>
        normalizeExternalTrack(track, "romantic", "clear")
      );

      setTrending(trendingItems.length ? trendingItems : trendingFallbackNormalized);
      setMoodSongs(moodItems.length ? moodItems : moodFallbackNormalized);
      setHistorySongs((historyRes.items || []).map((entry) => entry.song).filter(Boolean));
    } catch {
      setError("Could not load supporting sections.");
    }
  };

  const getByCity = async (city) => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const { data, tracks, moodForTracks } = await loadWeatherRecommendations({ city }, city);
      setWeatherData(data.weather);
      setRecommendations(tracks);
      setDetectedMood(moodForTracks);
      setTimeOfDay(data.timeOfDay || "evening");
      broadcastDashboardWeather(data?.weather?.condition || "clear");
      setPlayQueue(tracks);
      setActiveSong(tracks[0] || null);
      if (!tracks.length) {
        setError("No playable tracks were returned by available music providers.");
      }
    } catch (err) {
      setError(err.message || "Could not fetch weather recommendations.");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const getByLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { data, tracks, moodForTracks } = await loadWeatherRecommendations(
            {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            },
            "weather playlist"
          );
          setWeatherData(data.weather);
          setRecommendations(tracks);
          setDetectedMood(moodForTracks);
          setTimeOfDay(data.timeOfDay || "evening");
          broadcastDashboardWeather(data?.weather?.condition || "clear");
          setPlayQueue(tracks);
          setActiveSong(tracks[0] || null);
          if (!tracks.length) {
            setError("No playable tracks were returned by available music providers.");
          }
        } catch (err) {
          setError(err.message || "Could not fetch location-based recommendations.");
        } finally {
          setLoading(false);
          setInitialLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError("Unable to access location.");
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    loadSupportData().finally(() => setInitialLoading(false));
    getByCity("Chennai");
  }, []);

  const onLike = async (song) => {
    try {
      await userService.likeSong(song);
      setNotice(`Liked ${song.title || song.name}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const onDislike = async (song) => {
    try {
      await userService.dislikeSong(song);
      setNotice(`Skipped ${song.title || song.name}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const savePlaylist = async () => {
    if (!recommendations.length) {
      return;
    }

    const playlistSongIds = recommendations
      .map((song) => song.id)
      .filter((songId) => OBJECT_ID_REGEX.test(String(songId)))
      .slice(0, 10);

    const songItems = recommendations.slice(0, 10).map(toPlaylistSongItem);

    try {
      await playlistService.create({
        playlistName: `${weatherData?.city || "My"} ${detectedMood} Mix`,
        songs: playlistSongIds,
        songItems,
        mood: detectedMood,
        weatherType: weatherData?.condition,
      });
      setNotice("Playlist saved.");
    } catch (err) {
      setError(err.message || "Could not save playlist.");
    }
  };

  const onPlaySong = (song, sourceSongs = [], index = 0) => {
    const normalizedQueue = Array.isArray(sourceSongs) && sourceSongs.length ? sourceSongs : [song];
    setPlayQueue(normalizedQueue);
    setActiveSong(normalizedQueue[index] || song);
  };

  const onSelectSongFromQueue = (song, queueItems = [], index = 0) => {
    const normalizedQueue = Array.isArray(queueItems) && queueItems.length ? queueItems : playQueue;
    if (normalizedQueue.length) {
      setPlayQueue(normalizedQueue);
      setActiveSong(normalizedQueue[index] || song);
      return;
    }
    setActiveSong(song);
  };

  const sectionData = useMemo(
    () => ({
      weatherSongs: recommendations,
      trendingSongs: trending,
      becauseYouLiked: historySongs,
      similarMood: moodSongs,
      recentlyPlayed: historySongs,
      rainyRomantic: recommendations.filter((song) =>
        (song.weatherTags || []).some((tag) => String(tag).toLowerCase().includes("rain"))
      ),
      morningMotivation: trending.filter((song) =>
        (song.timeTags || []).some((tag) => String(tag).toLowerCase().includes("morning"))
      ),
      nightChill: moodSongs.filter((song) =>
        (song.timeTags || []).some((tag) => String(tag).toLowerCase().includes("night"))
      ),
    }),
    [historySongs, moodSongs, recommendations, trending]
  );

  return (
    <div className="space-y-5 pb-56 sm:pb-44 lg:pb-28">
      <SearchBar onSearch={getByCity} onUseLocation={getByLocation} loading={loading} />

      {error ? <div className="rounded-xl bg-red-500/15 px-4 py-2 text-sm text-red-200">{error}</div> : null}
      {notice ? <div className="rounded-xl bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100">{notice}</div> : null}

      {initialLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonLoader className="h-52" />
          <SkeletonLoader className="h-52" />
          <SkeletonLoader className="h-52" />
        </div>
      ) : weatherData ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WeatherCard weather={weatherData} />
          </div>
          <MoodCard mood={detectedMood} weather={weatherData?.condition} timeOfDay={timeOfDay} />
        </div>
      ) : (
        <EmptyState title="No weather loaded" description="Search for a city to get started." />
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={savePlaylist}
          className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Save Playlist
        </button>
      </div>

      <RecommendationCarousel
        title="Songs for this weather"
        songs={sectionData.weatherSongs}
        onPlay={onPlaySong}
        onLike={onLike}
        onDislike={onDislike}
      />

      <RecommendationCarousel
        title="Trending now"
        songs={sectionData.trendingSongs}
        onPlay={onPlaySong}
        onLike={onLike}
        onDislike={onDislike}
      />

      <RecommendationCarousel
        title="Because you liked..."
        songs={sectionData.becauseYouLiked}
        onPlay={onPlaySong}
        onLike={onLike}
        onDislike={onDislike}
      />

      <RecommendationCarousel
        title="Similar mood songs"
        songs={sectionData.similarMood}
        onPlay={onPlaySong}
        onLike={onLike}
        onDislike={onDislike}
      />

      <RecommendationCarousel
        title="Recently played"
        songs={sectionData.recentlyPlayed}
        onPlay={onPlaySong}
        onLike={onLike}
        onDislike={onDislike}
      />

      <RecommendationCarousel
        title="Top romantic rainy songs"
        songs={sectionData.rainyRomantic}
        onPlay={onPlaySong}
        onLike={onLike}
        onDislike={onDislike}
      />

      <RecommendationCarousel
        title="Morning motivation playlist"
        songs={sectionData.morningMotivation}
        onPlay={onPlaySong}
        onLike={onLike}
        onDislike={onDislike}
      />

      <RecommendationCarousel
        title="Night chill playlist"
        songs={sectionData.nightChill}
        onPlay={onPlaySong}
        onLike={onLike}
        onDislike={onDislike}
      />

      <FloatingMusicPlayer
        song={activeSong}
        queue={playQueue}
        onSelectSong={onSelectSongFromQueue}
        weatherType={weatherData?.condition || "clear"}
      />
    </div>
  );
}
