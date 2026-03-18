"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, Briefcase, MapPin, User, UserPlus, Check, Github, Linkedin, Twitter, Globe, Clock, Mail } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { getProfileByUserId, type UserProfileResponse } from "@/lib/auth-client";
import { 
  getConnectionStatus, 
  sendConnectionRequest,
  acceptConnectionRequest,
  removeConnection,
  type ConnectionStatus
} from "@/lib/chat-client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RequireAuth } from "@/components/auth/require-auth";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { token, user: currentUser } = useAuth();
  
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('NONE');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If viewing own profile, redirect to /profile/me
  useEffect(() => {
    if (currentUser?.id && String(currentUser.id) === userId) {
      router.replace("/profile/me");
    }
  }, [currentUser?.id, userId, router]);

  useEffect(() => {
    if (!token || (currentUser?.id && String(currentUser.id) === userId)) return;
    
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [profData, statusData] = await Promise.all([
          getProfileByUserId(token!, userId),
          getConnectionStatus(token!, userId)
        ]);
        setProfile(profData);
        setConnectionStatus(statusData);
      } catch (err: any) {
        console.error("Profile loading error:", err);
        setError("Failed to load user profile");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [token, userId, currentUser?.id]);

  const handleConnect = async () => {
    if (!token) return;
    setIsConnecting(true);
    try {
      await sendConnectionRequest(token, userId);
      setConnectionStatus('OUTGOING_PENDING');
      toast.success("Connection request sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send connection request");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;
    setIsConnecting(true);
    try {
      await acceptConnectionRequest(token, userId);
      setConnectionStatus('CONNECTED');
      toast.success("Connection accepted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to accept connection");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRemove = async () => {
    if (!token) return;
    setIsConnecting(true);
    try {
      await removeConnection(token, userId);
      setConnectionStatus('NONE');
      toast.success("Connection removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove connection");
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="size-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <RequireAuth>
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-[#0A0A0B] px-4 text-center">
          <div className="mb-6 rounded-full bg-red-500/10 p-6">
            <AlertCircle className="size-12 text-red-400" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">Profile Not Found</h1>
          <p className="mb-8 max-w-md text-zinc-400">
            We couldn't load the profile for user {userId}. The user may not exist or there was a temporary connection issue.
          </p>
          <Button onClick={() => router.push('/connections')} className="rounded-full bg-white text-black hover:bg-zinc-200">
            Go Back
          </Button>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="relative h-full overflow-y-auto w-full bg-[#0A0A0B] text-white">
        {/* Abstract Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[20%] top-0 h-[40%] w-[50%] rounded-[100%] bg-indigo-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
            {/* Header Banner */}
            <div className="h-32 bg-linear-to-r from-indigo-500/30 via-cyan-500/20 to-indigo-500/30 sm:h-48" />

            {/* Profile Content */}
            <div className="px-6 pb-8 sm:px-10">
              <div className="relative mb-6 flex items-end justify-between">
                {/* Avatar */}
                <div className="-mt-16 flex size-32 items-center justify-center overflow-hidden rounded-3xl border-4 border-[#0A0A0B] bg-indigo-500/30 text-5xl font-bold text-white shadow-xl backdrop-blur-md">
                   {profile?.avatarUrl ? (
                     <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                   ) : (
                     profile?.username?.charAt(0).toUpperCase() || "?"
                   )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  {connectionStatus === 'NONE' && (
                    <Button 
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      {isConnecting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
                      Connect
                    </Button>
                  )}
                  {connectionStatus === 'OUTGOING_PENDING' && (
                    <Button disabled variant="outline" className="rounded-full border-white/20 text-white">
                      <Clock className="mr-2 size-4" /> Request Sent
                    </Button>
                  )}
                   {connectionStatus === 'INCOMING_PENDING' && (
                    <Button 
                      onClick={handleAccept}
                      disabled={isConnecting}
                      className="rounded-full bg-white text-black hover:bg-zinc-200"
                    >
                      {isConnecting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
                      Accept Request
                    </Button>
                  )}
                  {connectionStatus === 'CONNECTED' && (
                    <Button 
                      onClick={handleRemove}
                      disabled={isConnecting}
                      variant="outline" 
                      className="rounded-full border-green-500/30 bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
                    >
                      {isConnecting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
                      Connected (Remove)
                    </Button>
                  )}
                </div>
              </div>

              {/* View Mode */}
              <div className="space-y-8 animate-in fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white leading-tight">{profile?.username}</h1>
                    {profile?.headline && (
                      <p className="mt-1 flex items-center gap-2 text-lg text-indigo-300">
                        <Briefcase className="size-4 shrink-0" />
                        {profile.headline}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {profile?.socialLinks?.linkedin && (
                      <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-[#0077b5] transition-all">
                        <Linkedin className="size-5" />
                      </a>
                    )}
                    {profile?.githubUsername && (
                      <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                        <Github className="size-5" />
                      </a>
                    )}
                    {profile?.socialLinks?.twitter && (
                      <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-[#1da1f2] transition-all">
                        <Twitter className="size-5" />
                      </a>
                    )}
                    {profile?.socialLinks?.website && (
                      <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-indigo-400 transition-all">
                        <Globe className="size-5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
                  {/* Main column */}
                  <div className="space-y-8">
                    <div>
                      <h2 className="mb-3 font-special text-xl font-semibold text-white">About</h2>
                      <div className="rounded-2xl border border-white/5 bg-white/10/40 p-5 backdrop-blur-sm">
                        {profile?.bio ? (
                          <p className="whitespace-pre-wrap leading-relaxed text-zinc-300">
                            {profile.bio}
                          </p>
                        ) : (
                          <p className="font-medium italic text-zinc-500">No bio provided yet.</p>
                        )}
                      </div>
                    </div>

                    {profile?.skills && profile.skills.length > 0 && (
                      <div>
                        <h2 className="mb-3 font-special text-xl font-semibold text-white">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="px-4 py-1.5 rounded-xl border-white/10 bg-white/5 text-zinc-300">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar column */}
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Information</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-zinc-300">
                          <div className="p-2 rounded-lg bg-indigo-500/10">
                            <MapPin className="size-4 text-indigo-400" />
                          </div>
                          <div className="min-w-0">
                             <p className="text-[10px] uppercase text-zinc-500 font-bold">Status</p>
                             <p className="truncate text-sm">{profile?.email ? "Active Member" : "Unknown"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-zinc-300">
                          <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Mail className="size-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                             <p className="text-[10px] uppercase text-zinc-500 font-bold">Email</p>
                             <p className="truncate text-sm">{profile?.email || "Private"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-zinc-300">
                          <div className="p-2 rounded-lg bg-orange-500/10">
                            <User className="size-4 text-orange-400" />
                          </div>
                          <div className="min-w-0">
                             <p className="text-[10px] uppercase text-zinc-500 font-bold">Member ID</p>
                             <p className="truncate text-[10px] font-mono text-zinc-400">{profile?.userId}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

