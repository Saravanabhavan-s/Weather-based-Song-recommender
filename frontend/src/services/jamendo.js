const JAMENDO_TRACKS_URL = "https://api.jamendo.com/v3.0/tracks/";
const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID;
const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";

const MOOD_KEYWORDS = {
  rainy: ["rain", "sad", "mellow"],
  happy: ["happy", "upbeat", "dance"],
  chill: ["chill", "calm", "relax"],
  energetic: ["workout", "edm", "party"],
  romantic: ["love", "romantic", "soft"],
};

function getRandomKeyword(keywords) {
  return keywords[Math.floor(Math.random() * keywords.length)];
}

function mapTrack(track) {
  return {
    id: track.id,
    name: track.name,
    artist: track.artist_name,
    album: track.album_name,
    image: track.image,
    audio: track.audio,
    duration: track.duration,
    source: "jamendo",
  };
}

function mapItunesTrack(track) {
  const artwork = String(track.artworkUrl100 || "").replace("100x100", "512x512");
  const durationSeconds = Number.isFinite(track.trackTimeMillis)
    ? Math.round(track.trackTimeMillis / 1000)
    : 30;

  return {
    id: track.trackId || track.collectionId,
    name: track.trackName,
    artist: track.artistName,
    album: track.collectionName,
    image: artwork || null,
    audio: track.previewUrl,
    duration: durationSeconds,
    source: "itunes",
  };
}

async function fetchItunesTracks(searchTerm) {
  try {
    const url = new URL(ITUNES_SEARCH_URL);
    url.searchParams.set("term", searchTerm);
    url.searchParams.set("media", "music");
    url.searchParams.set("entity", "song");
    url.searchParams.set("limit", "10");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`iTunes API request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const results = Array.isArray(payload?.results) ? payload.results : [];

    return results
      .filter((item) => item?.previewUrl && item?.trackName)
      .map(mapItunesTrack);
  } catch (error) {
    console.error(`[iTunes] Failed to fetch tracks for search term "${searchTerm}": ${error.message}`);
    return [];
  }
}

async function fetchTracks(searchTerm) {
  let jamendoTracks = [];

  if (!JAMENDO_CLIENT_ID) {
    console.warn("[Jamendo] Missing VITE_JAMENDO_CLIENT_ID in environment. Falling back to iTunes previews.");
  }

  if (JAMENDO_CLIENT_ID) {
    try {
      const url = new URL(JAMENDO_TRACKS_URL);
      url.searchParams.set("client_id", JAMENDO_CLIENT_ID);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "10");
      url.searchParams.set("search", searchTerm);
      url.searchParams.set("include", "musicinfo");

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Jamendo API request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const apiStatus = String(payload?.headers?.status || "").toLowerCase();
      if (apiStatus && apiStatus !== "success") {
        const apiMessage = payload?.headers?.error_message || "Jamendo API returned a failed status.";
        throw new Error(apiMessage);
      }

      const results = Array.isArray(payload?.results) ? payload.results : [];
      jamendoTracks = results.map(mapTrack);
    } catch (error) {
      console.error(`[Jamendo] Failed to fetch tracks for search term "${searchTerm}": ${error.message}`);
    }
  }

  if (jamendoTracks.length) {
    return jamendoTracks;
  }

  const itunesTracks = await fetchItunesTracks(searchTerm);
  if (!itunesTracks.length) {
    console.warn(`[Tracks] No playable tracks found for search term "${searchTerm}".`);
  }
  return itunesTracks;
}

export async function searchTracks(query) {
  const searchTerm = String(query || "").trim();
  if (!searchTerm) {
    return [];
  }

  return fetchTracks(searchTerm);
}

export async function getTracksByMood(mood) {
  const normalizedMood = String(mood || "").trim().toLowerCase();
  const keywords = MOOD_KEYWORDS[normalizedMood] || [normalizedMood || "music"];
  const selectedKeyword = getRandomKeyword(keywords);

  return fetchTracks(selectedKeyword);
}
