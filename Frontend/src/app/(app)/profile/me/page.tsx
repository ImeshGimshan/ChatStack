"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Edit2, MapPin, Briefcase, Link as LinkIcon, Save, X, Github, Linkedin, Twitter, Globe, Plus, Trash2 } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { getMyProfile, updateMyProfile, type UserProfileResponse } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RequireAuth } from "@/components/auth/require-auth";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function MyProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [formData, setFormData] = useState({
    bio: "",
    headline: "",
    avatarUrl: "",
    githubUsername: "",
    skills: [] as string[],
    socialLinks: {
      linkedin: "",
      github: "",
      twitter: "",
      website: ""
    }
  });
  
  const [newSkill, setNewSkill] = useState("");

  const loadProfile = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await getMyProfile(token!);
      setProfile(data);
      setFormData({
        bio: data.bio || "",
        headline: data.headline || "",
        avatarUrl: data.avatarUrl || "",
        githubUsername: data.githubUsername || "",
        skills: data.skills || [],
        socialLinks: {
          linkedin: data.socialLinks?.linkedin || "",
          github: data.socialLinks?.github || "",
          twitter: data.socialLinks?.twitter || "",
          website: data.socialLinks?.website || ""
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateMyProfile(formData, token);
      toast.success("Profile updated successfully!");
      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        bio: profile.bio || "",
        headline: profile.headline || "",
        avatarUrl: profile.avatarUrl || "",
        githubUsername: profile.githubUsername || "",
        skills: profile.skills || [],
        socialLinks: {
          linkedin: profile.socialLinks?.linkedin || "",
          github: profile.socialLinks?.github || "",
          twitter: profile.socialLinks?.twitter || "",
          website: profile.socialLinks?.website || ""
        }
      });
    }
    setIsEditing(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="size-8 animate-spin text-indigo-400" />
      </div>
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
          {error && (
            <Alert className="mb-6 border-red-300/30 bg-red-500/10">
              <AlertCircle className="size-4 text-red-400" />
              <AlertDescription className="text-red-100">{error}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
            {/* Header Banner */}
            <div className="h-32 bg-linear-to-r from-indigo-500/30 via-cyan-500/20 to-indigo-500/30 sm:h-48" />

            {/* Profile Content */}
            <div className="px-4 pb-8 sm:px-10">
              <div className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                {/* Avatar */}
                <div className="-mt-12 sm:-mt-16 flex size-24 sm:size-32 items-center justify-center overflow-hidden rounded-3xl border-4 border-[#0A0A0B] bg-indigo-500/30 text-4xl sm:text-5xl font-bold text-white shadow-xl backdrop-blur-md">
                   {formData.avatarUrl ? (
                     <img src={formData.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                   ) : (
                     profile?.username?.charAt(0).toUpperCase() || "?"
                   )}
                </div>
                
                {/* Edit Button */}
                {!isEditing && (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="rounded-full bg-white/10 text-white hover:bg-white/20 w-full sm:w-auto"
                  >
                    <Edit2 className="mr-2 size-4" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-300">Avatar URL</label>
                        <Input
                          value={formData.avatarUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                          placeholder="https://example.com/photo.jpg"
                          className="border-white/20 bg-white/5"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-300">Headline</label>
                        <Input
                          value={formData.headline}
                          onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                          placeholder="Occupation or short description"
                          className="border-white/20 bg-white/5"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-300">Bio</label>
                        <Textarea
                          value={formData.bio}
                          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Tell us about yourself..."
                          rows={4}
                          className="border-white/20 bg-white/5"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-300">Skills</label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Add a skill..."
                            className="border-white/20 bg-white/5"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          />
                          <Button size="icon" variant="ghost" onClick={addSkill} className="rounded-xl border border-white/10">
                            <Plus className="size-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map(skill => (
                            <Badge key={skill} variant="secondary" className="pl-3 pr-2 py-1 gap-1 bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                              {skill}
                              <button onClick={() => removeSkill(skill)} className="hover:text-white transition-colors">
                                <X className="size-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-300">Social Links</label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Linkedin className="size-4 text-zinc-500 shrink-0" />
                            <Input
                              value={formData.socialLinks.linkedin}
                              onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, linkedin: e.target.value } }))}
                              placeholder="LinkedIn URL"
                              className="h-9 text-xs border-white/20 bg-white/5"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Twitter className="size-4 text-zinc-500 shrink-0" />
                            <Input
                              value={formData.socialLinks.twitter}
                              onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                              placeholder="Twitter URL"
                              className="h-9 text-xs border-white/20 bg-white/5"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="size-4 text-zinc-500 shrink-0" />
                            <Input
                              value={formData.socialLinks.website}
                              onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, website: e.target.value } }))}
                              placeholder="Personal Website"
                              className="h-9 text-xs border-white/20 bg-white/5"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Github className="size-4 text-zinc-500 shrink-0" />
                            <Input
                              value={formData.githubUsername}
                              onChange={(e) => setFormData(prev => ({ ...prev, githubUsername: e.target.value, socialLinks: { ...prev.socialLinks, github: e.target.value ? `https://github.com/${e.target.value}` : "" } }))}
                              placeholder="GitHub Username"
                              className="h-9 text-xs border-white/20 bg-white/5"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-6 border-t border-white/10">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 w-full sm:w-auto"
                    >
                      {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                      Save Profile
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="text-zinc-400 hover:text-white rounded-full px-6 w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-8 animate-in fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight truncate">{profile?.username}</h1>
                      {profile?.headline && (
                        <p className="mt-1 flex items-center gap-2 text-lg text-indigo-300">
                          <Briefcase className="size-4 shrink-0" />
                          {profile.headline}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
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
                               <p className="text-[10px] uppercase text-zinc-500 font-bold">Location</p>
                               <p className="truncate text-sm">{profile?.email ? "Global / Remote" : "Not specified"}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-zinc-300">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                              <LinkIcon className="size-4 text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-[10px] uppercase text-zinc-500 font-bold">Email</p>
                               <p className="truncate text-sm">{profile?.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-zinc-300">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                              <Loader2 className="size-4 text-orange-400" />
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
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

