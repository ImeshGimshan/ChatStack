"use client";
import { useEffect, useState, useCallback } from "react";
import { postService, CreatePostPayload, UpdatePostPayload } from "@/services/post.service";
import { Post } from "@/lib/types";

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await postService.getPosts();
      setPosts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load posts";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (payload: CreatePostPayload): Promise<Post> => {
    const newPost = await postService.createPost(payload);
    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  };

  const updatePost = async (id: number, payload: UpdatePostPayload): Promise<Post> => {
    const updated = await postService.updatePost(id, payload);
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deletePost = async (id: number): Promise<void> => {
    await postService.deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return { posts, loading, error, createPost, updatePost, deletePost, refetch: fetchPosts };
}
