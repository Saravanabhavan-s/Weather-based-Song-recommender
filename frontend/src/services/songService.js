import { api } from "./api";

export const songService = {
  async search(query, limit = 30) {
    const value = String(query || "").trim();
    if (!value) {
      return { items: [], count: 0 };
    }

    const response = await api.get("/songs", {
      params: {
        search: value,
        limit,
      },
    });

    return response.data;
  },
};
