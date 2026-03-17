"use client";

import { useEffect, useState } from "react";
import { 
  getMyConnections, 
  getPendingRequests, 
  acceptConnectionRequest, 
  removeConnection,
  type ChatUser,
  type ConnectionRequest
} from "@/lib/chat-client";
import { useAuth } from "@/contexts/auth-context";
import { searchProfilesByUsername, type UserProfileResponse } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserPlus, UserMinus, Check, X, Users, Search, ArrowRight, FileQuestion } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ConnectionsPage() {
  const { token } = useAuth();
  const [connections, setConnections] = useState<ChatUser[]>([]);
  const [pending, setPending] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Discover state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfileResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [connData, pendingData] = await Promise.all([
        getMyConnections(token),
        getPendingRequests(token)
      ]);
      setConnections(connData);
      setPending(pendingData);
    } catch (err) {
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleAccept = async (requesterId: string) => {
    if (!token) return;
    setProcessingId(requesterId);
    try {
      await acceptConnectionRequest(token, requesterId);
      toast.success("Connection accepted");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!token) return;
    setProcessingId(userId);
    try {
      await removeConnection(token, userId);
      toast.success("Connection removed");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove connection");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim() || !token) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const data = await searchProfilesByUsername(token, searchQuery.trim());
      const uniqueData = Array.from(new Map(data.map(item => [String(item.userId || (item as any).id), item])).values());
      setSearchResults(uniqueData);
    } catch (err) {
      toast.error("Search failed");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  if (loading && connections.length === 0 && pending.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto w-full">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Network</h1>
        <p className="text-muted-foreground">Manage your connections and pending requests.</p>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="connections">Connections ({connections.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-6">
          {connections.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-2xl">
              <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground">No connections yet. Start exploring!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {connections.map((user) => (
                <motion.div 
                  key={user.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 bg-card border rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.profile?.avatarUrl} />
                      <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{user.profile?.displayName || user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(user.id)}
                    disabled={processingId === user.id}
                  >
                    {processingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {pending.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-2xl">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground">No pending requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((request) => (
                <motion.div 
                  key={request.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 bg-card border rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.requester?.profile?.avatarUrl} />
                      <AvatarFallback>{request.requester?.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{request.requester?.profile?.displayName || request.requester?.username}</p>
                      <p className="text-xs text-muted-foreground">Sent a connection request</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleAccept(request.requesterId)}
                      disabled={processingId === request.requesterId}
                    >
                      {processingId === request.requesterId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleRemove(request.requesterId)}
                      disabled={processingId === request.requesterId}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discover" className="mt-6">
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search users by username..."
                  className="pl-10 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" className="h-12 px-6" disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
              </Button>
            </div>
          </form>

          {isSearching ? (
             <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : hasSearched && searchResults.length === 0 ? (
             <div className="text-center py-12 border border-dashed rounded-xl">
               <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
               <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
             </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {searchResults.map((profile) => {
                const searchId = profile.userId || (profile as any).id;
                return (
                <motion.div 
                  key={searchId}
                  layout 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 cursor-pointer" onClick={() => router.push(`/profile/${searchId}`)}>
                      <AvatarImage src={profile.avatarUrl} />
                      <AvatarFallback>{profile.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p 
                        className="font-bold cursor-pointer hover:underline"
                        onClick={() => router.push(`/profile/${searchId}`)}
                      >
                        {profile.username}
                      </p>
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/profile/${searchId}`)}>
                    View <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
