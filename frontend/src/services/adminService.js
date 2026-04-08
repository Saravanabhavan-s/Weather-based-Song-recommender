import { api } from "./api";

export const adminService = {
  async analytics() {
    const response = await api.get("/admin/analytics");
    return response.data;
  },
  async settings() {
    const response = await api.get("/admin/settings");
    return response.data;
  },
  async updateSettings(payload) {
    const response = await api.put("/admin/settings", payload);
    return response.data;
  },
  async recommendationControls() {
    const response = await api.get("/admin/recommendation-controls");
    return response.data;
  },
  async updateRecommendationControls(payload) {
    const response = await api.put("/admin/recommendation-controls", payload);
    return response.data;
  },
  async weatherMapping() {
    const response = await api.get("/admin/weather-mapping");
    return response.data;
  },
  async updateWeatherMapping(payload) {
    const response = await api.put("/admin/weather-mapping", payload);
    return response.data;
  },
  async playlists(limit = 100) {
    const response = await api.get("/admin/playlists", { params: { limit } });
    return response.data;
  },
  async deletePlaylist(playlistId) {
    await api.delete(`/admin/playlists/${playlistId}`);
  },
  async securityLogs(limit = 80) {
    const response = await api.get("/admin/security/logs", { params: { limit } });
    return response.data;
  },
  async systemHealth() {
    const response = await api.get("/admin/health");
    return response.data;
  },
  async revenue() {
    const response = await api.get("/admin/revenue");
    return response.data;
  },
  async notifications(limit = 100) {
    const response = await api.get("/admin/notifications", { params: { limit } });
    return response.data;
  },
  async createNotification(payload) {
    const response = await api.post("/admin/notifications", payload);
    return response.data;
  },
  async updateNotification(notificationId, payload) {
    const response = await api.patch(`/admin/notifications/${notificationId}`, payload);
    return response.data;
  },
  async feedback(limit = 100) {
    const response = await api.get("/admin/feedback", { params: { limit } });
    return response.data;
  },
  async createFeedback(payload) {
    const response = await api.post("/admin/feedback", payload);
    return response.data;
  },
  async updateFeedback(feedbackId, payload) {
    const response = await api.patch(`/admin/feedback/${feedbackId}`, payload);
    return response.data;
  },
  async users(limit = 50) {
    const response = await api.get("/admin/users", { params: { limit } });
    return response.data;
  },
  async weatherTrends() {
    const response = await api.get("/admin/weather-trends");
    return response.data;
  },
  async setUserBlocked(userId, blocked, reason = "") {
    const response = await api.patch(`/admin/users/${userId}/block`, { blocked, reason });
    return response.data;
  },
  async deleteUser(userId) {
    await api.delete(`/admin/users/${userId}`);
  },
  async songs(limit = 100, search = "") {
    const params = { limit };
    if (search) {
      params.search = search;
    }
    const response = await api.get("/songs", { params });
    return response.data;
  },
  async createSong(payload) {
    const response = await api.post("/songs", payload);
    return response.data;
  },
  async updateSong(songId, payload) {
    const response = await api.put(`/songs/${songId}`, payload);
    return response.data;
  },
  async deleteSong(songId) {
    await api.delete(`/songs/${songId}`);
  },
};
