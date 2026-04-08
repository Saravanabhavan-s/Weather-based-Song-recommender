import { api } from "./api";

function buildSongActionPayload(input) {
  if (typeof input === "string") {
    return { songId: input };
  }

  const song = input || {};
  return {
    songId: String(song.id || ""),
    song: {
      externalId: song.externalId ? String(song.externalId) : undefined,
      source: song.source,
      title: song.title || song.name || "Unknown title",
      artist: song.artist || "Unknown artist",
      album: song.album || undefined,
      albumArt: song.albumArt || song.image || undefined,
      audio: song.audio || undefined,
      soundcloudUrl: song.soundcloudUrl || song.audio || undefined,
      moods: Array.isArray(song.moods) ? song.moods : [],
      weatherTags: Array.isArray(song.weatherTags) ? song.weatherTags : [],
      timeTags: Array.isArray(song.timeTags) ? song.timeTags : [],
      duration: Number.isFinite(song.duration) ? song.duration : undefined,
    },
  };
}

export const userService = {
  async profile() {
    const response = await api.get("/user/profile");
    return response.data;
  },
  async updateProfile(payload) {
    const response = await api.put("/user/profile", payload);
    return response.data;
  },
  async likeSong(song) {
    const payload = buildSongActionPayload(song);
    const response = await api.post("/user/like-song", payload);
    return response.data;
  },
  async dislikeSong(song) {
    const payload = buildSongActionPayload(song);
    const response = await api.post("/user/dislike-song", payload);
    return response.data;
  },
  async history(limit = 20) {
    const response = await api.get("/user/history", { params: { limit } });
    return response.data;
  },
};
