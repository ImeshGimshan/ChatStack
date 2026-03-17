"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Heart, 
  Repeat2, 
  Plus, 
  Loader2, 
  AlertCircle,
  Share2,
  MoreHorizontal,
  Bookmark
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { 
  getFeedPosts, 
  createFeedPost, 
  type FeedPost 
} from "@/lib/chat-client";
import { getMyConnections } from "@/lib/chat-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

function PostCard({ post, i }: { post: FeedPost; i: number }) {
  const authorName = post.author?.profile?.displayName || "Anonymous";
  const avatarText = authorName.substring(0, 2).toUpperCase();

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.3 }}
      className="group bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl overflow-hidden hover:bg-card/60 transition-all duration-300 shadow-sm hover:shadow-md"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border border-border/50">
            <AvatarFallback className="bg-surface text-xs font-bold text-foreground">
              {avatarText}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground hover:text-primary cursor-pointer transition-colors">
                  {authorName}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  • {formatDistanceToNow(new Date(post.createdAt))} ago
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-foreground">
                <MoreHorizontal size={16} />
              </Button>
            </div>

            {post.title && (
              <h3 className="text-base font-bold text-foreground mb-1 leading-tight tracking-tight">
                {post.title}
              </h3>
            )}
            
            <p className="text-sm text-foreground/80 leading-relaxed break-words whitespace-pre-wrap mb-4">
              {post.content}
            </p>

            {post.imageId && (
              <div className="relative aspect-video rounded-xl overflow-hidden mb-4 border border-border/30 bg-surface">
                <img 
                  src={post.imageId} 
                  alt="Post content" 
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-500" 
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/10">
              <div className="flex items-center gap-1 sm:gap-6">
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-primary/10">
                  <Heart size={16} />
                  <span>Like</span>
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-primary/10">
                  <MessageSquare size={16} />
                  <span>Comment</span>
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-primary/10">
                  <Repeat2 size={16} />
                  <span>Boost</span>
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
        <div key={i} className="bg-card/40 border border-border/40 rounded-2xl p-5 space-y-4">
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
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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

  const handlePost = async () => {
    if (!content.trim() || !token) return;
    setPosting(true);
    try {
      // serverId is now optional for global/personal posts
      const post = await createFeedPost(token, {
        content,
        title: title || undefined,
        // No serverId means it's a personal/global feed post
      });

      setPosts(prev => [post, ...prev]);
      setTitle('');
      setContent('');
      setComposing(false);
      toast.success("Post published to your feed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="relative min-h-svh bg-background/95 pb-20 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-30 select-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[680px] mx-auto px-4 py-8 relative z-10">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-foreground">Community</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Your Daily Connections
            </p>
          </div>
          <Button 
            className="rounded-full px-6 shadow-glow hover:shadow-glow-primary transition-all duration-500"
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
              className="bg-card/70 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 mb-8 shadow-xl overflow-hidden"
            >
              <div className="space-y-4">
                <Input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Post Title (optional)" 
                  className="bg-surface/50 border-border focus-visible:ring-primary h-11 text-base font-bold"
                  maxLength={100}
                />
                <Textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder="What's happening in your space?" 
                  className="bg-surface/50 border-border focus-visible:ring-primary min-h-[120px] text-base leading-relaxed"
                  maxLength={5000}
                />
                <div className="flex justify-end items-center gap-3 pt-2">
                  <Button variant="ghost" className="font-semibold text-muted-foreground" onClick={() => setComposing(false)}>
                    Discard
                  </Button>
                  <Button 
                    className="px-8 font-bold" 
                    onClick={handlePost} 
                    disabled={posting || !content.trim()}
                  >
                    {posting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Post
                  </Button>
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
          <div className="bg-card/30 border border-border/20 rounded-3xl p-16 text-center space-y-4 backdrop-blur-sm">
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
              <PostCard key={post.id} post={post} i={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
