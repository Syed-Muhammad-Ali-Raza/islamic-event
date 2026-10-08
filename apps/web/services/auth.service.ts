import { apiClient } from "@/lib/api-client";
import type { ApiSuccess, AuthTokens, User } from "@/types";

export const authService = {
  async register(data: { name: string; email: string; password: string; phone?: string }) {
    const res = await apiClient.post<ApiSuccess<AuthTokens>>("/auth/register", data);
    return res.data.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await apiClient.post<ApiSuccess<AuthTokens>>("/auth/login", data);
    return res.data.data;
  },

  async logout() {
    await apiClient.post("/auth/logout");
  },

  async getMe() {
    const res = await apiClient.get<ApiSuccess<User>>("/auth/me");
    return res.data.data;
  },
};
