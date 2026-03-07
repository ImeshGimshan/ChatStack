import chatApi from "@/api/chatApi";
import axios from "axios";

export interface Channel {
  id: string;
  name: string;
  description?: string;
  serverId: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  isEncrypted: boolean;
  createdAt: string;
}

export const channelService = {
  async getChannels(serverId: string): Promise<Channel[]> {
    try {
      const response = await chatApi.get<Channel[]>("/channels", {
        params: { serverId },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || "Failed to fetch channels");
      }
      throw new Error("Failed to fetch channels");
    }
  },

  async createChannel(serverId: string, name: string, description?: string): Promise<Channel> {
    try {
      const response = await chatApi.post<Channel>(
        "/channels",
        { name, description },
        { params: { serverId } },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || "Failed to create channel");
      }
      throw new Error("Failed to create channel");
    }
  },

  async getMessages(channelId: string, limit = 50): Promise<ChannelMessage[]> {
    try {
      const response = await chatApi.get<ChannelMessage[]>(
        `/channels/${channelId}/messages`,
        { params: { limit } },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || "Failed to fetch messages");
      }
      throw new Error("Failed to fetch messages");
    }
  },
  async getMyChannels(): Promise<Channel[]> {
    try {
      const response = await chatApi.get<Channel[]>("/channels/me");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || "Failed to fetch my channels");
      }
      throw new Error("Failed to fetch my channels");
    }
  },
};
