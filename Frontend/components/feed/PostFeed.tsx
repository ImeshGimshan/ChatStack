'use client';
import { usePosts } from "@/hooks/usePosts";
import CreatePostCard from "./CreatePostCard";
import PostCard from "./PostCard";
import { Loader2, Rss } from "lucide-react";
import { CreatePostPayload } from "@/services/post.service";

export default function PostFeed() {
    const { posts, loading, error, createPost, updatePost, deletePost } = usePosts();

    const handleCreate = async (payload: CreatePostPayload) => {
        await createPost(payload);
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                <CreatePostCard onCreate={handleCreate} />
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading posts...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-4">
                <CreatePostCard onCreate={handleCreate} />
                <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive text-center">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <CreatePostCard onCreate={handleCreate} />

            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <div className="rounded-full bg-muted p-5">
                        <Rss className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">No posts yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">Be the first to share something!</p>
                    </div>
                </div>
            ) : (
                posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onUpdate={updatePost}
                        onDelete={deletePost}
                    />
                ))
            )}
        </div>
    );
}
