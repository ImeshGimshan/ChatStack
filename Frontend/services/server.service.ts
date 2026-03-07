import chatApi from "@/api/chatApi";
import axios from "axios";

export interface CreateServerPayload {
  name: string;
  description?: string;
}

export interface ServerResponse {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
}

export const serverService = {
  async createServer(payload: CreateServerPayload): Promise<ServerResponse> {
    try {
      const response = await chatApi.post<ServerResponse>("/server", payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const msg = error.response.data?.message || "Failed to create server";
        throw new Error(msg);
      }
      throw new Error("Failed to create server");
    }
  },

  async getServerById(id: string): Promise<ServerResponse> {
    try {
      const response = await chatApi.get<ServerResponse>(`/server/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const msg = error.response.data?.message || "Failed to fetch server";
        throw new Error(msg);
      }
      throw new Error("Failed to fetch server");
    }
  },

  async getMyServers(): Promise<ServerResponse[]> {
    try {
      const response = await chatApi.get<ServerResponse[]>("/server/me");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const msg = error.response.data?.message || "Failed to fetch servers";
        throw new Error(msg);
      }
      throw new Error("Failed to fetch servers");
    }
  },

  async getServersByMember(): Promise<ServerResponse[]> {
    try {
      const response = await chatApi.get<ServerResponse[]>("/server/mine");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const msg = error.response.data?.message || "Failed to fetch servers";
        throw new Error(msg);
      }
      throw new Error("Failed to fetch servers");
    }
  },
};
