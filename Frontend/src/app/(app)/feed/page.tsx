"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Heart, 
  Repeat2, 
  Plus, 
  Loader2, 
  AlertCircle,
  Share2,
  ArrowLeft,
  Paperclip,
  X,
    MoreHorizontal,
  MoreVertical,
  Send,
  Bookmark,
  Pencil,
  Trash2
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  getFeedPosts,
  createFeedPost, 
  updateFeedPost,
  deletePost,
  toggleFeedPostLike,
  getPostComments,
  createComment,
  deleteComment,
  updateComment,
  type FeedPost,
  type FeedComment
} from "@/lib/chat-client";
import { getMyConnections } from "@/lib/chat-client";
import { getMediaAccessUrl, uploadMediaFile } from "@/lib/media-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function PostImage({ imageId }: { imageId: string }) {
  const [src, setSrc] = useState<string | null>(null);
  
  useEffect(() => {
     getMediaAccessUrl(imageId).then(setSrc).catch(console.error);
  }, [imageId]);

  if (!src) return <Skeleton className="w-full aspect-video rounded-xl mb-4" />;
  
  const isVideo = src.match(/\.(mp4|webm|avi|mkv|mov|ogg)(\?.*)?$/i);

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden mb-4 border border-white/10 bg-black/80">
      {isVideo ? (
        <video src={src} controls className="w-full h-full object-cover" />
      ) : (
        <img src={src} alt="Post content" className="object-cover w-full h-full" />
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
        <AvatarFallback className="bg-black/80 text-[10px] font-bold text-white">
          {avatarText}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span onClick={() => router.push(`/profile/${comment.authorId}`)} className="text-base font-bold text-white tracking-wide cursor-pointer hover:text-indigo-300 transition-colors">
              {authorName}
            </span>
            <span className="text-xs text-zinc-500 font-medium">
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
              className="min-h-[80px] bg-black/40 border-white/10 text-white shadow-inner text-sm resize-none rounded-xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500/50"
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
          <p className="text-sm text-zinc-300 leading-relaxed break-words">
            {comment.content}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function PostCard({
  post, 
  i,
  onDelete,
  onUpdate
}: {
  post: FeedPost;
  i: number;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, newContent: string) => void;
}) {
  const router = useRouter();
  const { user, token } = useAuth();
  const isAuthor = String(post.authorId) === String(user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [liked, setLiked] = useState(!!post.hasLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
    
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<FeedComment[]>([]);
    const [newCommentText, setNewCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

  const authorName = post.author?.profile?.displayName || (post.author as any)?.username || "Anonymous";
  const avatarText = authorName.substring(0, 2).toUpperCase();

  const handleUpdate = () => {
    if (editContent.trim() && editContent !== post.content) {
      onUpdate?.(post.id, editContent);
    }
    setIsEditing(false);
  };

  
  

  

  

  


  const handleToggleComments = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showComments) {
      try {
        const commentData = await getPostComments(post.id);
        setComments(commentData || []);
      } catch (err) {
        console.error("Failed to load comments");
      }
    }
    setShowComments(!showComments);
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !token) return;

    setSubmittingComment(true);
    try {
      const newComment = await createComment(token, {
        postId: post.id,
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

  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteComment(token, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete comment");
    }
  };

  const handleUpdateComment = async (commentId: string, newContent: string) => {
    if (!token) return;
    try {
      const updated = await updateComment(token, commentId, newContent);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: updated.content, updatedAt: updated.updatedAt } : c));
      toast.success("Comment updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update comment");
    }
  };

const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // so it doesn't trigger post click navigation
    if (!token) return;
    try {
      const isCurrentlyLiked = liked;
      setLiked(!isCurrentlyLiked);
      setLikeCount((prev) => (isCurrentlyLiked ? prev - 1 : prev + 1));
      
      await toggleFeedPostLike(token, post.id);
    } catch (err) {
      setLiked(liked);
      setLikeCount(likeCount);
      toast.error("Failed to toggle like");
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.3 }}
      className="group bg-black/50 border border-white/10 rounded-2xl backdrop-blur-xl hover:border-indigo-500/50 transition-all duration-300 hover:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.2)] overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar onClick={() => router.push(`/profile/${post.authorId}`)} className="h-10 w-10 border border-border/50 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarFallback className="bg-black/80 text-xs font-bold text-white">
              {avatarText}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span onClick={() => router.push(`/profile/${post.authorId}`)} className="text-base font-bold text-white tracking-wide cursor-pointer hover:text-indigo-300 transition-colors">
                  {authorName}
                </span>
                <span className="text-sm text-zinc-500 font-medium">
                  • {formatDistanceToNow(new Date(post.createdAt))} ago
                </span>
              </div>
              
              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-foreground">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete?.(post.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {post.title && (
              <h3 className="text-base font-bold text-foreground mb-1 leading-tight tracking-tight">
                {post.title}
              </h3>
            )}
            
            {isEditing ? (
              <div className="mb-4 space-y-2">
                <Textarea 
                  value={editContent} 
                  onChange={(e) => setEditContent(e.target.value)} 
                  className="min-h-[100px] resize-none bg-background/50"
                  autoFocus
                />
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setIsEditing(false);
                    setEditContent(post.content);
                  }}>Cancel</Button>
                  <Button size="sm" onClick={handleUpdate}>Save</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed break-words whitespace-pre-wrap mb-4">
                {post.content}
              </p>
            )}

            {post.imageId && <PostImage imageId={post.imageId} />}

            <div className="flex items-center justify-between pt-2 border-t border-border/10">
              <div className="flex items-center gap-1 sm:gap-6">
                <button 
                    onClick={handleLike}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors py-1 px-2 rounded-lg ${liked ? 'text-rose-500 hover:text-rose-600 bg-rose-500/10' : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10'}`}
                >
                  <Heart size={16} className={liked ? "fill-current" : ""} />
                  <span>{liked ? `${likeCount} Liked` : `${likeCount} Like${likeCount !== 1 ? 's' : ''}`}</span>
                </button>
                <button 
                  onClick={handleToggleComments}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-primary/10"
                >
                  <MessageSquare size={16} />
                  <span>{post.comments ? post.comments.length : 0} Comments</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-muted-foreground/40 hover:text-primary transition-colors p-1.5">
                  <Bookmark size={15} />
                </button>
                <button className="text-muted-foreground/40 hover:text-primary transition-colors p-1.5">
                  <Share2 size={15} />
                </button>
              </div>
            </div>

            {/* Inline Comments Section */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/5 overflow-hidden"
                >
                  {token && (
                    <form onSubmit={handleCreateComment} className="flex gap-3 mb-4">
                      <Avatar className="h-8 w-8 border border-border/40">
                        <AvatarFallback className="bg-black/80 text-[10px] font-bold text-white">
                          {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 relative">
                        <Input
                          value={newCommentText}
                          onChange={e => setNewCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          className="h-10 pl-4 bg-black/40 border-white/10 text-white rounded-xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500/50 placeholder:text-zinc-600 shadow-inner pr-10 text-sm"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={!newCommentText.trim() || submittingComment}
                          className="absolute right-0.5 top-0.5 h-8 w-8 rounded-full"
                        >
                          {submittingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send size={14} />}
                        </Button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-1 max-h-[350px] overflow-y-auto">
                    {comments.length === 0 ? (
                      <div className="py-4 text-center text-xs text-muted-foreground/50">
                        No comments yet. Be the first to comment!
                      </div>
                    ) : (
                      <div className="divide-y divide-border/5">
                        {comments.map(comment => (
                          <CommentItem
                            key={comment.id}
                            comment={comment}
                            isAuthor={String(comment.authorId) === String(user?.id)}
                            onDelete={handleDeleteComment}
                            onUpdate={handleUpdateComment}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </motion.article>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-black/50 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function FeedPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Backend now handles connection-based filtering when token is passed
        const allPosts = await getFeedPosts(token);
        setPosts(allPosts);
      } catch (err) {
        setError("Could not load feed. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const handleDeletePost = async (postId: string) => {
    if (!token) return;
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost(token, postId);
        setPosts(prev => prev.filter(p => p.id !== postId));
        toast.success("Post deleted successfully");
      } catch (err: any) {
        toast.error("Failed to delete post");
      }
    }
  };

  const handleUpdatePost = async (postId: string, newContent: string) => {
    if (!token) return;
    try {
      await updateFeedPost(token, postId, { content: newContent });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: newContent } : p));
      toast.success("Post updated successfully");
    } catch (err: any) {
      toast.error("Failed to update post");
    }
  };

  const handlePost = async () => {
    if ((!content.trim() && !attachment) || !token) return;
    setPosting(true);
    try {
      let imageId = undefined;
      if (attachment) {
        const uploadRes = await uploadMediaFile(attachment);
        imageId = uploadRes.publicId;
      }
      
      const post = await createFeedPost(token, {
        content,
        title: title || undefined,
        imageId,
        // No serverId means it's a personal/global feed post
      });

      setPosts(prev => [post, ...prev]);
      setTitle('');
      setContent('');
      setAttachment(null);
      setComposing(false);
      toast.success("Post published to your feed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="relative h-full pb-20 overflow-x-hidden overflow-y-auto w-full">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-30 select-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[1400px] mx-auto p-6 md:p-10 space-y-8 w-full relative z-10">
        
          <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-12 w-12 rounded-full bg-black/50 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all duration-300 shadow-sm shrink-0"
              onClick={() => router.push('/chat')}
              title="Back to Chat"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight drop-shadow-electric-glow tracking-wider text-white">Community</h1>
              <p className="text-zinc-400 mt-2 font-medium">Your Daily Connections</p>
            </div>
          </div>
          <Button 
            className="h-12 px-6 rounded-xl border border-indigo-300/35 bg-linear-to-r from-indigo-500 via-indigo-600 to-blue-500 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300 hover:from-indigo-400 hover:via-indigo-500 hover:to-blue-400 hover:shadow-[0_0_16px_rgba(99,102,241,0.5)]"
            onClick={() => setComposing(!composing)}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="font-bold">Share something</span>
          </Button>
        </header>

        {/* Composer */}
        <AnimatePresence>
          {composing && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="bg-black/50 border border-white/10 rounded-2xl backdrop-blur-xl p-6 mb-8 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.2)] overflow-hidden"
            >
              <div className="space-y-4">
                <Input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Post Title (optional)" 
                  className="bg-black/40 border-white/10 text-white rounded-xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500/50 shadow-inner h-12 text-base font-bold"
                  maxLength={100}
                />
                <Textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder="What's happening in your space?" 
                  className="bg-surface/50 border-border focus-visible:ring-primary min-h-[120px] text-base leading-relaxed"
                  maxLength={5000}
                />
                <div className="flex flex-col gap-2 pt-2">
                  {attachment && (
                    <div className="relative inline-block w-fit bg-surface/50 rounded p-2">
                      <span className="text-xs truncate max-w-[200px] block">{attachment.name}</span>
                      <button onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <input type="file" id="post-file" className="hidden" accept="image/*,video/*" onChange={(e) => e.target.files && setAttachment(e.target.files[0])} />
                      <label htmlFor="post-file" className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium">
                        <Paperclip className="w-4 h-4" /> Media
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" className="font-semibold text-muted-foreground" onClick={() => { setComposing(false); setAttachment(null); }}>
                        Discard
                      </Button>
                      <Button
                        className="px-8 font-bold"
                        onClick={handlePost}
                        disabled={posting || (!content.trim() && !attachment)}
                      >
                        {posting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {loading ? (
          <FeedSkeleton />
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-10 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive opacity-50" />
            <h3 className="text-lg font-bold text-foreground">Snapshot Failure</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              We encountered a glitch while fetching your community feed.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Re-sync Feed
            </Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-black/20 border border-white/10 rounded-3xl p-16 text-center space-y-4 backdrop-blur-xl">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-2 border border-border/50">
              <Share2 className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Your Feed is Quiet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              Connect with more people or be the first to start a conversation in your community.
            </p>
            {!composing && (
              <Button className="mt-4" onClick={() => setComposing(true)}>
                Start a conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, i) => (
              <PostCard 
                key={post.id} 
                post={post} 
                i={i} 
                onDelete={handleDeletePost} 
                onUpdate={handleUpdatePost} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
