import { api } from "./api";

export const recommendationService = {
  async weather(params) {
    const response = await api.get("/recommendations/weather", { params });
    return response.data;
  },
  async trending(limit = 12) {
    const response = await api.get("/recommendations/trending", { params: { limit } });
    return response.data;
  },
  async byMood(mood, limit = 12) {
    const response = await api.get(`/recommendations/mood/${mood}`, { params: { limit } });
    return response.data;
  },
};
