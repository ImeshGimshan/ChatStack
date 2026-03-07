'use client';
import { useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ImagePlus, X } from "lucide-react";
import { CreatePostPayload } from "@/services/post.service";
import { mediaService } from "@/services/media.service";
import { useAuth } from "@/context/AuthContext";
import { useDefaultServer } from "@/hooks/useDefaultServer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CreatePostCardProps {
    onCreate: (payload: CreatePostPayload) => Promise<void>;
}

const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export default function CreatePostCard({ onCreate }: CreatePostCardProps) {
    const { user } = useAuth();
    const { serverId } = useDefaultServer();
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imagePublicId, setImagePublicId] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be under 5MB.');
            return;
        }

        setError(null);
        setIsUploading(true);

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        try {
            const result = await mediaService.uploadMedia(file);
            setImagePublicId(result.publicId);
        } catch (err) {
            setError('Image upload failed. Please try again.');
            setImagePreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setImagePublicId(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) { setError('Post content is required.'); return; }
        setError(null);
        setIsSubmitting(true);

        try {
            if (!serverId) { setError('Server not ready. Please try again.'); setIsSubmitting(false); return; }
            await onCreate({
                content: content.trim(),
                title: title.trim() || undefined,
                serverId,
                imageId: imagePublicId || undefined,
            });
            setContent('');
            setTitle('');
            setImagePublicId(null);
            setImagePreview(null);
            setIsExpanded(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create post.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="bg-card border-border/60">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Create a Post</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-3 pt-0">
                    <div className="flex gap-3">
                        <Avatar className="h-9 w-9 bg-primary flex-shrink-0">
                            <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                                {user ? getInitials(user.username) : 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onFocus={() => setIsExpanded(true)}
                            placeholder="What's on your mind?"
                            rows={isExpanded ? 3 : 1}
                            className="flex-1 resize-none text-sm bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                        />
                    </div>

                    {isExpanded && (
                        <div className="space-y-3 pl-12">
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Add a title (optional)"
                                className="h-9 text-sm bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
                            />

                            {imagePreview && (
                                <div className="relative w-full rounded-lg overflow-hidden aspect-video bg-muted">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="rounded-md bg-destructive/15 p-2.5 text-xs text-destructive">{error}</div>
                            )}
                        </div>
                    )}
                </CardContent>

                {isExpanded && (
                    <CardFooter className="flex justify-between pt-2 pb-4">
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpg,image/jpeg,image/png,image/gif"
                                className="hidden"
                                id="post-image-upload"
                                onChange={handleFileChange}
                                disabled={isUploading || isSubmitting}
                            />
                            <Label
                                htmlFor="post-image-upload"
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-muted"
                            >
                                <ImagePlus className="h-4 w-4" />
                                {imagePublicId ? 'Change image' : 'Add image'}
                            </Label>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => { setIsExpanded(false); setError(null); }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting || isUploading || !content.trim()}
                            >
                                {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                                Post
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </form>
        </Card>
    );
}
