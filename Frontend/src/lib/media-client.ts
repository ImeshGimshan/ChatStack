import { parseApiError } from "@/lib/api-client";

const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_API || "http://localhost:3004";

export async function uploadMediaFile(file: File): Promise<{ publicId: string; format?: string }> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${MEDIA_BASE_URL}/media/upload`, {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to upload media.");
  }

  const data = (await response.json()) as { publicId: string; format?: string };
  return {
    publicId: data.publicId,
    format: data.format
  };
}

export async function getMediaAccessUrl(publicId: string): Promise<string> {
  const response = await fetch(`${MEDIA_BASE_URL}/media/access/${encodeURIComponent(publicId)}`, {
    method: "GET"
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to access media.");
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

export async function deleteMediaFile(publicId: string): Promise<void> {
  const response = await fetch(`${MEDIA_BASE_URL}/media/${encodeURIComponent(publicId)}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to delete media.");
  }
}
