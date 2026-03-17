"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft, ImagePlus, X } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { RequireAuth } from "@/components/auth/require-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFeedPost, getMyServers } from "@/lib/chat-client";
import { uploadMediaFile } from "@/lib/media-client";
import type { ChatServer } from "@/lib/chat-client";

import { toast } from "sonner";

function PostComposerContent() {
  const { token } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [serverId, setServerId] = useState("");
  const [servers, setServers] = useState<ChatServer[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's servers
  useEffect(() => {
    if (!token) return;
    const authToken = token;

    async function loadServers() {
      try {
        const data = await getMyServers(authToken);
        setServers(data || []);
        if (data && data.length > 0) {
          setServerId(String(data[0].id));
        }
      } catch (err) {
        console.error("Failed to load servers:", err);
        setError("Failed to load servers.");
      } finally {
        setIsLoading(false);
      }
    }

    loadServers();
  }, [token]);

  const canSubmit =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    serverId.length > 0 &&
    !isSubmitting;

  const charCount = content.length;
  const MAX_CONTENT_LENGTH = 5000;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  function handleSelectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be 5MB or smaller.");
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setError(null);
  }

  function clearSelectedImage() {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImage(null);
    setImagePreviewUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !token) return;

    setIsSubmitting(true);
    setError(null);

    const toastId = toast.loading("Publishing post...");

    try {
      let imageId: string | undefined;

      if (selectedImage) {
        setIsUploadingImage(true);
        const uploaded = await uploadMediaFile(selectedImage);
        imageId = uploaded.publicId;
      }

      const newPost = await createFeedPost(token, {
        title: title.trim(),
        content: content.trim(),
        serverId,
        imageId
      });

      toast.success("Post published successfully", { id: toastId });
      router.push(`/feed/${newPost.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create post.";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-indigo-400" />
          <p className="text-sm text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <AlertCircle className="mx-auto size-8 text-yellow-400" />
        <h2 className="text-lg font-semibold text-white">No Servers Found</h2>
        <p className="text-sm text-zinc-400">
          You need to join or create a server before posting.
        </p>
        <Button
          onClick={() => router.push("/chat")}
          className="mt-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          Go to Chat
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/12 bg-black/45 p-5 shadow-[0_14px_36px_rgba(79,70,229,0.18)] backdrop-blur-xl sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="h-8 w-8 rounded-full p-0 text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-special text-xl font-semibold tracking-tight text-white">Create Post</h1>
          <p className="text-xs text-zinc-400">Share something with your community</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-300/30 bg-red-500/10">
          <AlertCircle className="size-4 text-red-400" />
          <AlertDescription className="text-red-100">{error}</AlertDescription>
        </Alert>
      )}

      {/* Server Selection */}
      <div className="space-y-2.5">
        <Label htmlFor="server" className="text-sm font-medium text-zinc-200">
          Post to Server
        </Label>
        <select
          id="server"
          value={serverId}
          onChange={(e) => setServerId(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
        >
          <option value="">Select a server</option>
          {servers.map((server) => (
            <option key={server.id} value={String(server.id)}>
              {server.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="image" className="text-sm font-medium text-zinc-200">
          Media (Optional)
        </Label>

        {imagePreviewUrl ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black/35">
            <img src={imagePreviewUrl} alt="Selected post media preview" className="h-52 w-full object-cover" />
            <Button
              type="button"
              variant="ghost"
              onClick={clearSelectedImage}
              className="absolute right-2 top-2 h-8 w-8 rounded-full border border-white/20 bg-black/60 p-0 text-white hover:bg-black/75"
              aria-label="Remove selected image"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <label
            htmlFor="image"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-8 text-sm text-zinc-300 transition-colors hover:border-indigo-300/60 hover:bg-indigo-500/10"
          >
            <ImagePlus className="size-4" />
            Add image (max 5MB)
          </label>
        )}

        <Input
          id="image"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif"
          onChange={handleSelectImage}
          className="hidden"
        />
      </div>

      {/* Title */}
      <div className="space-y-2.5">
        <Label htmlFor="title" className="text-sm font-medium text-zinc-200">
          Title <span className="text-red-400">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="Give your post a catchy title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="rounded-lg border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus:border-indigo-400 focus:bg-white/10 focus:ring-2 focus:ring-indigo-400/30"
        />
        <p className="text-xs text-zinc-400">{title.length}/200</p>
      </div>

      {/* Content */}
      <div className="space-y-2.5">
        <Label htmlFor="content" className="text-sm font-medium text-zinc-200">
          Content <span className="text-red-400">*</span>
        </Label>
        <textarea
          id="content"
          placeholder="Share your thoughts, ideas, or updates..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_CONTENT_LENGTH}
          rows={8}
          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400 focus:bg-white/10 focus:ring-2 focus:ring-indigo-400/30 resize-none"
        />
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Share your thoughts...</span>
          <span className={charCount > MAX_CONTENT_LENGTH * 0.9 ? "text-yellow-400" : ""}>
            {charCount}/{MAX_CONTENT_LENGTH}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 border-t border-white/10 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!canSubmit}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white text-black hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {(isSubmitting || isUploadingImage) && <Loader2 className="size-4 animate-spin" />}
          {isUploadingImage ? "Uploading image..." : isSubmitting ? "Publishing..." : "Publish Post"}
        </Button>
      </div>
    </form>
  );
}

export default function CreatePostPage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(79,70,229,0.12),transparent_40%),radial-gradient(circle_at_82%_88%,rgba(255,255,255,0.05),transparent_34%)]" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8">
        <PostComposerContent />
      </div>
    </div>
  );
}
