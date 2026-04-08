import { api } from "./api";

export const authService = {
  async register(payload) {
    const response = await api.post("/auth/register", payload);
    return response.data;
  },
  async login(payload) {
    const response = await api.post("/auth/login", payload);
    return response.data;
  },
  async oauthGoogle(payload) {
    const response = await api.post("/auth/oauth/google", payload);
    return response.data;
  },
  async me() {
    const response = await api.get("/auth/me");
    return response.data;
  },
};
