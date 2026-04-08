import { api } from "./api";

export const playlistService = {
  async create(payload) {
    const response = await api.post("/playlists", payload);
    return response.data;
  },
  async list() {
    const response = await api.get("/playlists");
    return response.data;
  },
  async remove(playlistId) {
    await api.delete(`/playlists/${playlistId}`);
  },
};
