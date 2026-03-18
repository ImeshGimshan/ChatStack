"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Trash2,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Send,
  Pencil,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import {
  getPostComments,
  createComment,
  deleteComment,
  updateComment,
  deletePost,
  updateFeedPost,
  getPostById,
  toggleFeedPostLike,
  type FeedPost,
  type FeedComment
} from "@/lib/chat-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { getMediaAccessUrl } from "@/lib/media-client";
import { Skeleton } from "@/components/ui/skeleton";

function PostImage({ imageId }: { imageId: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
     getMediaAccessUrl(imageId).then(setSrc).catch(console.error);
  }, [imageId]);

  if (!src) return <Skeleton className="w-full aspect-video rounded-2xl mb-6" />;

  const isVideo = src.match(/\.(mp4|webm|avi|mkv|mov|ogg)(\?.*)?$/i);

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 block ring-1 ring-border/50">
      {isVideo ? (
        <video src={src} controls className="w-full h-full object-cover transition-transform duration-700 ease-out" />
      ) : (
        <img src={src} alt="Post content" className="w-full h-full object-cover transition-transform duration-700 ease-out" />
      )}
    </div>
  );
}

function CommentItem({
  comment,
  isAuthor,
  onDelete,
  onUpdate
}: {
  comment: FeedComment;
  isAuthor: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, newContent: string) => void;
}) {
  const router = useRouter();
  const authorName = comment.author?.profile?.displayName || (comment.author as any)?.username || "Anonymous";
  const avatarText = authorName.substring(0, 2).toUpperCase();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleSave = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onUpdate(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-4 group py-4"
    >
      <Avatar onClick={() => router.push(`/profile/${comment.authorId}`)} className="h-9 w-9 border border-border/40 cursor-pointer hover:opacity-80 transition-opacity">
        <AvatarFallback className="bg-surface text-[10px] font-bold">
          {avatarText}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span onClick={() => router.push(`/profile/${comment.authorId}`)} className="text-sm font-bold text-foreground hover:text-primary cursor-pointer transition-colors">
              {authorName}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              • {formatDistanceToNow(new Date(comment.createdAt))} ago
            </span>
          </div>

          {isAuthor && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] cursor-pointer">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil size={14} className="mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] bg-background/50 border-input text-sm resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!editContent.trim() || editContent === comment.content}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/80 leading-relaxed break-words">
            {comment.content}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function PostDetailPageContent() {
  const params = useParams();
  const { token, user } = useAuth();
  const router = useRouter();

  const postId = params.id as string;
  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (!postId) {
      router.push("/feed");
      return;
    }

    const loadPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const found = await getPostById(postId, token);
        if (!found) {
          setError("Post not found");
        } else {
          setPost(found);
          setLikeCount(found.likeCount ?? 0); setLiked(!!found.hasLiked);
          const commentData = await getPostComments(postId);
          setComments(commentData || []);
        }
      } catch (err) {
        setError("Failed to load post details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  const handleLike = async () => {
    if (!token || !post) return;
    try {
      const isCurrentlyLiked = liked;
      setLiked(!isCurrentlyLiked);
      setLikeCount((prev) => (isCurrentlyLiked ? prev - 1 : prev + 1));
      
      await toggleFeedPostLike(token, post.id);
    } catch (err) {
      // Revert optimistic update
      setLiked(liked);
      setLikeCount(likeCount);
      toast.error("Failed to toggle like");
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !token) return;

    setSubmittingComment(true);
    try {
      const newComment = await createComment(token, {
        postId,
        content: newCommentText.trim()
      });
      setComments(prev => [...prev, newComment]);
      setNewCommentText("");
      toast.success("Comment added!");
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!token || !post) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost(token, post.id);
      toast.success("Post deleted");
      router.replace("/feed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete post");
    }
  };

  const handleUpdatePost = async () => {
    if (!token || !post || !editContent.trim()) return;
    try {
      const updated = await updateFeedPost(token, post.id, { content: editContent.trim() });
      setPost(prev => prev ? { ...prev, content: updated.content, updatedAt: updated.updatedAt } : null);
      setIsEditing(false);
      toast.success("Post updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update post");
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!token) return;
    try {
      await deleteComment(token, id);
      setComments(prev => prev.filter(c => c.id !== id));
      toast.success("Comment removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete comment");
    }
  };

  const handleUpdateComment = async (id: string, newContent: string) => {
    if (!token) return;
    try {
      const updated = await updateComment(token, id, newContent);
      setComments(prev => prev.map(c => c.id === id ? { ...c, content: updated.content } : c));
      toast.success("Comment updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update comment");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-bold tracking-widest uppercase">Fetching Post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-[680px] mx-auto text-center space-y-6 py-20">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-black">{error || "Post Not Found"}</h2>
        <Button variant="outline" onClick={() => router.push("/feed")} className="rounded-full">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Feed
        </Button>
      </div>
    );
  }

  const isAuthor = String(post.authorId) === String(user?.id);
  const authorName = post.author?.profile?.displayName || (post.author as any)?.username || "Anonymous";

  return (
    <div className="max-w-[800px] mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-full h-10 px-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2 items-center">
          {isAuthor && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5">
                  <MoreVertical size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl">
                <DropdownMenuItem 
                  onClick={() => {
                    setEditContent(post.content);
                    setIsEditing(true);
                  }}
                  className="gap-2 focus:bg-white/5 rounded-xl cursor-pointer py-2 font-medium"
                >
                  <Pencil size={15} className="text-muted-foreground" />
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeletePost}
                  className="gap-2 focus:bg-destructive/10 text-destructive focus:text-destructive rounded-xl cursor-pointer py-2 font-medium"
                >
                  <Trash2 size={15} />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
            <Share2 size={18} />
          </Button>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-3xl overflow-hidden shadow-2xl mb-8"
      >
        <div className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-6">
            <Avatar onClick={() => router.push(`/profile/${post.authorId}`)} className="h-12 w-12 border-2 border-primary/20 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarFallback className="bg-surface text-sm font-bold">
                {authorName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 onClick={() => router.push(`/profile/${post.authorId}`)} className="text-lg font-bold text-foreground leading-none hover:text-primary cursor-pointer transition-colors">{authorName}</h2>
              <p className="text-xs text-muted-foreground mt-1 font-medium italic">
                {formatDistanceToNow(new Date(post.createdAt))} ago
              </p>
            </div>
          </div>

          {post.title && (
            <h1 className="text-3xl font-black tracking-tight text-foreground mb-4 leading-tight">
              {post.title}
            </h1>
          )}

          {isEditing ? (
            <div className="space-y-4 mb-6">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-background/50 border-input font-medium text-lg leading-relaxed focus-visible:ring-1 focus-visible:ring-primary/50 min-h-[150px] resize-none p-4 rounded-2xl"
                autoFocus
                placeholder="What's heavily on your mind?"
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsEditing(false)}
                  className="rounded-full px-6 hover:bg-white/5 font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdatePost}
                  disabled={!editContent.trim() || editContent === post.content}
                  className="rounded-full px-6 bg-primary font-bold text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-lg text-foreground/90 leading-relaxed whitespace-pre-wrap mb-6 font-medium">
              {post.content}
            </p>
          )}

          {post.imageId && <PostImage imageId={post.imageId} />}

          <div className="flex items-center gap-8 py-4 border-t border-border/10">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${liked ? 'text-rose-500 hover:text-rose-600' : 'text-muted-foreground hover:text-rose-500'}`}
            >
              <Heart size={20} className={liked ? "fill-current" : ""} /> {liked ? `${likeCount} Liked` : `${likeCount} Like${likeCount !== 1 ? 's' : ''}`}
            </button>
            <button className="flex items-center gap-2 text-sm font-bold text-primary transition-colors">
              <MessageSquare size={20} /> {comments.length} Comments
            </button>
            <button className="ml-auto flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
              <Bookmark size={20} /> Save
            </button>
          </div>
        </div>
      </motion.div>

      <div className="bg-card/20 backdrop-blur-md border border-border/30 rounded-3xl p-8 shadow-xl">
        <h3 className="text-xl font-black mb-6 tracking-tight">Discussion</h3>
        
        {token && (
          <form onSubmit={handleCreateComment} className="flex gap-4 mb-8">
            <Avatar className="h-10 w-10 border border-border/40">
              <AvatarFallback className="bg-surface text-xs font-bold">
                {user?.username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <Input 
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                placeholder="Write a thoughtful comment..."
                className="h-12 bg-surface/50 border-border pr-12 rounded-xl focus:ring-primary font-medium"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!newCommentText.trim() || submittingComment}
                className="absolute right-1 top-1 h-10 w-10 rounded-lg"
              >
                {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={18} />}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {comments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground/50 italic font-medium">
              No comments yet. Share your thoughts!
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              <AnimatePresence>
                {comments.map(comment => (
                  <CommentItem 
                    key={comment.id}
                    comment={comment}
                    isAuthor={String(comment.authorId) === String(user?.id)}
                    onDelete={handleDeleteComment}
                    onUpdate={handleUpdateComment}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PostDetailPage() {
  return (
    <div className="relative min-h-svh bg-background/95 overflow-hidden py-10 px-4">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full">
        <PostDetailPageContent />
      </div>
    </div>
  );
}
