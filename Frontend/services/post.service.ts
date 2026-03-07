import chatApi from "@/api/chatApi";
import { Post } from "@/lib/types";
import axios from "axios";

export interface CreatePostPayload {
  title?: string;
  content: string;
  serverId: string;
  imageId?: string;
}

export interface UpdatePostPayload {
  title?: string;
  content?: string;
  imageId?: string;
}

export const postService = {
  async getPosts(): Promise<Post[]> {
    try {
      const response = await chatApi.get<Post[]>("/posts");
      return response.data;
    } catch (error) {
      console.error("Get posts error:", error);
      if (axios.isAxiosError(error) && error.response) {
        const msg =
          error.response.data?.message || error.response.data?.error || "Failed to load posts";
        throw new Error(msg);
      }
      throw new Error("Failed to load posts");
    }
  },

  async createPost(payload: CreatePostPayload): Promise<Post> {
    try {
      const response = await chatApi.post<Post>("/posts", payload);
      return response.data;
    } catch (error) {
      console.error("Create post error:", error);
      if (axios.isAxiosError(error) && error.response) {
        const msg =
          error.response.data?.message || error.response.data?.error || "Failed to create post";
        throw new Error(msg);
      }
      throw new Error("Failed to create post");
    }
  },

  async updatePost(id: number, payload: UpdatePostPayload): Promise<Post> {
    try {
      const response = await chatApi.patch<Post>(`/posts/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error("Update post error:", error);
      if (axios.isAxiosError(error) && error.response) {
        const msg =
          error.response.data?.message || error.response.data?.error || "Failed to update post";
        throw new Error(msg);
      }
      throw new Error("Failed to update post");
    }
  },

  async deletePost(id: number): Promise<void> {
    try {
      await chatApi.delete(`/posts/${id}`);
    } catch (error) {
      console.error("Delete post error:", error);
      if (axios.isAxiosError(error) && error.response) {
        const msg =
          error.response.data?.message || error.response.data?.error || "Failed to delete post";
        throw new Error(msg);
      }
      throw new Error("Failed to delete post");
    }
  },
};
