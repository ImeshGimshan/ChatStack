'use client';
import { useState } from "react";
import { Post } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit2, Trash2, Heart, X, Check } from "lucide-react";
import { UpdatePostPayload } from "@/services/post.service";
import { mediaService } from "@/services/media.service";
import Image from "next/image";

interface PostCardProps {
    post: Post;
    onUpdate: (id: number, payload: UpdatePostPayload) => Promise<Post>;
    onDelete: (id: number) => Promise<void>;
}

const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function PostCard({ post, onUpdate, onDelete }: PostCardProps) {
    const { user } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editTitle, setEditTitle] = useState(post.title || '');
    const [editContent, setEditContent] = useState(post.content);
    const [error, setError] = useState<string | null>(null);

    // For image display — try to resolve publicId to signed URL
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageFetched, setImageFetched] = useState(false);

    const fetchImage = async () => {
        if (!post.imageUrl || imageFetched) return;
        setImageFetched(true);
        try {
            const url = await mediaService.getMediaUrl(post.imageUrl);
            setImageUrl(url);
        } catch {
            setImageUrl(null);
        }
    };

    // Fetch image on mount if there's an imageUrl
    if (post.imageUrl && !imageFetched) {
        fetchImage();
    }

    const isAuthor = user && (
        String(user.id) === String(post.authorId) ||
        String(user.id) === String(post.author?.id)
    );

    const handleSave = async () => {
        if (!editContent.trim()) { setError('Content cannot be empty.'); return; }
        setError(null);
        setIsSaving(true);
        try {
            await onUpdate(post.id, { title: editTitle || undefined, content: editContent });
            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(post.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete post.');
            setIsDeleting(false);
        }
    };

    const handleLike = () => {
        setLiked((prev) => !prev);
        setLikeCount((prev) => liked ? prev - 1 : prev + 1);
    };

    const authorName = post.author?.username || `User ${post.authorId}`;

    return (
        <Card className="bg-card border-border/60 hover:border-border transition-colors">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 bg-primary">
                            <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                                {getInitials(authorName)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-semibold">{authorName}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                        </div>
                    </div>
                    {isAuthor && !isEditing && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                        </div>
                    )}
                    {isEditing && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-500 hover:text-green-600"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => { setIsEditing(false); setError(null); }}
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
                {error && (
                    <div className="rounded-md bg-destructive/15 p-2.5 text-xs text-destructive">{error}</div>
                )}

                {isEditing ? (
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs mb-1 block">Title (optional)</Label>
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Post title"
                                className="h-9 text-sm"
                            />
                        </div>
                        <div>
                            <Label className="text-xs mb-1 block">Content</Label>
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="What's on your mind?"
                                rows={3}
                                className="text-sm resize-none"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {post.title && (
                            <h3 className="font-semibold text-base leading-snug">{post.title}</h3>
                        )}
                        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                        {imageUrl && (
                            <div className="relative w-full rounded-lg overflow-hidden aspect-video bg-muted">
                                <Image src={imageUrl} alt="Post image" fill className="object-cover" />
                            </div>
                        )}
                        {post.imageUrl && !imageUrl && !imageFetched && (
                            <div className="h-32 rounded-lg bg-muted animate-pulse" />
                        )}
                    </>
                )}
            </CardContent>

            <CardFooter className="pt-2 pb-3">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
                        }`}
                >
                    <Heart className={`h-4 w-4 ${liked ? 'fill-red-500' : ''}`} />
                    <span>{likeCount > 0 ? likeCount : ''} {liked ? 'Liked' : 'Like'}</span>
                </button>
            </CardFooter>
        </Card>
    );
}
