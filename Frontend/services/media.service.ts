import mediaApi from "@/api/mediaApi";
import axios from "axios";

export interface UploadResponse {
  publicId: string;
  format: string;
}

export interface MediaUrlResponse {
  url: string;
}

export const mediaService = {
  async uploadMedia(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await mediaApi.post<UploadResponse>("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      console.error("Upload error:", error);
      if (axios.isAxiosError(error) && error.response) {
        const msg =
          error.response.data?.message || error.response.data?.error || "Upload failed";
        throw new Error(msg);
      }
      throw new Error("Upload failed");
    }
  },

  async deleteMedia(publicId: string): Promise<void> {
    try {
      await mediaApi.delete(`/media/${publicId}`);
    } catch (error) {
      console.error("Delete media error:", error);
      throw new Error("Failed to delete media");
    }
  },

  async getMediaUrl(publicId: string): Promise<string> {
    try {
      const response = await mediaApi.get<MediaUrlResponse>(`/media/access/${publicId}`);
      return response.data.url;
    } catch (error) {
      console.error("Get media URL error:", error);
      throw new Error("Failed to get media URL");
    }
  },
};
