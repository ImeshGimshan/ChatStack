"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userService, DeveloperProfile, ProfileUpdatePayload, Experience, Education } from "@/services/user.service";
import { socialService } from "@/services/social.service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Briefcase, GraduationCap, MapPin, Github, Linkedin, Twitter, Globe,
    Edit2, Check, X, Plus, Trash2, Sparkles, Users,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfileView() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<DeveloperProfile | null>(null);
    const [connectionCount, setConnectionCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Editable fields
    const [headline, setHeadline] = useState("");
    const [bio, setBio] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState("");
    const [openToCollab, setOpenToCollab] = useState(false);
    const [githubUsername, setGithubUsername] = useState("");
    const [socialLinks, setSocialLinks] = useState({ linkedin: "", github: "", twitter: "", website: "" });
    const [experience, setExperience] = useState<Experience[]>([]);
    const [education, setEducation] = useState<Education[]>([]);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const [p, count] = await Promise.all([
                userService.getMyProfile(),
                user ? socialService.getConnectionCount(user.id).catch(() => ({ connectionCount: 0 })) : { connectionCount: 0 },
            ]);
            setProfile(p);
            setConnectionCount(count.connectionCount);
            populateForm(p);
        } catch {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const populateForm = (p: DeveloperProfile) => {
        setHeadline(p.headline || "");
        setBio(p.bio || "");
        setSkills(p.skills || []);
        setOpenToCollab(p.openToCollaboration || false);
        setGithubUsername(p.githubUsername || "");
        setSocialLinks(p.socialLinks || { linkedin: "", github: "", twitter: "", website: "" });
        setExperience(p.experience || []);
        setEducation(p.education || []);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: ProfileUpdatePayload = {
                headline, bio, skills, openToCollaboration: openToCollab,
                githubUsername, socialLinks, experience, education,
            };
            const updated = await userService.updateMyProfile(payload);
            setProfile(updated);
            setEditing(false);
            toast.success("Profile updated!");
        } catch {
            toast.error("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const addSkill = () => {
        const trimmed = newSkill.trim();
        if (trimmed && !skills.includes(trimmed)) {
            setSkills([...skills, trimmed]);
            setNewSkill("");
        }
    };

    const removeSkill = (s: string) => setSkills(skills.filter((sk) => sk !== s));

    const addExperience = () => setExperience([...experience, { company: "", role: "", startDate: "", endDate: "", description: "" }]);
    const removeExperience = (i: number) => setExperience(experience.filter((_, idx) => idx !== i));
    const updateExp = (i: number, field: keyof Experience, value: string) => {
        const copy = [...experience];
        copy[i] = { ...copy[i], [field]: value };
        setExperience(copy);
    };

    const addEducation = () => setEducation([...education, { insitution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "" }]);
    const removeEducation = (i: number) => setEducation(education.filter((_, idx) => idx !== i));
    const updateEdu = (i: number, field: keyof Education, value: string) => {
        const copy = [...education];
        copy[i] = { ...copy[i], [field]: value };
        setEducation(copy);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="space-y-5">
            {/* Header Card */}
            <Card className="overflow-hidden border-border/60">
                <div className="h-24 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
                <CardContent className="relative pt-0 -mt-10">
                    <div className="flex items-end gap-4">
                        <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
                            <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                                {profile.username?.[0]?.toUpperCase() ?? "?"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 pb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold">{profile.username}</h1>
                                {profile.openToCollaboration && (
                                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Open to Collaborate
                                    </Badge>
                                )}
                            </div>
                            {editing ? (
                                <Input
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    placeholder="Your headline, e.g. Full-Stack Dev @ OpenAI"
                                    className="mt-1 max-w-md"
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground mt-0.5">{profile.headline || "No headline yet"}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-center px-3">
                                <p className="text-lg font-bold">{connectionCount}</p>
                                <p className="text-xs text-muted-foreground">Connections</p>
                            </div>
                            {editing ? (
                                <div className="flex gap-1.5">
                                    <Button size="sm" onClick={handleSave} disabled={saving}>
                                        <Check className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => { setEditing(false); populateForm(profile); }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                                    <Edit2 className="h-4 w-4 mr-1" />Edit
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bio & About */}
            <Card className="border-border/60">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">About</CardTitle>
                </CardHeader>
                <CardContent>
                    {editing ? (
                        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about yourself..." rows={3} />
                    ) : (
                        <p className="text-sm leading-relaxed">{profile.bio || "No bio yet."}</p>
                    )}
                </CardContent>
            </Card>

            {/* Skills */}
            <Card className="border-border/60">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Skills</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                        {(editing ? skills : profile.skills)?.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs px-2.5 py-1">
                                {skill}
                                {editing && (
                                    <button onClick={() => removeSkill(skill)} className="ml-1.5 hover:text-destructive">
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </Badge>
                        ))}
                        {editing && (
                            <div className="flex items-center gap-1.5">
                                <Input
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                                    placeholder="Add skill"
                                    className="h-7 w-28 text-xs"
                                />
                                <Button size="sm" variant="ghost" onClick={addSkill} className="h-7 w-7 p-0">
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                        {!editing && profile.skills?.length === 0 && (
                            <p className="text-xs text-muted-foreground">No skills added yet.</p>
                        )}
                    </div>

                    {editing && (
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/60">
                            <Switch checked={openToCollab} onCheckedChange={setOpenToCollab} />
                            <Label className="text-sm">Open to Collaborate</Label>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Experience */}
            <Card className="border-border/60">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />Experience
                    </CardTitle>
                    {editing && (
                        <Button size="sm" variant="ghost" onClick={addExperience}><Plus className="h-4 w-4 mr-1" />Add</Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {(editing ? experience : profile.experience)?.map((exp, i) => (
                        <div key={i} className="relative">
                            {editing ? (
                                <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-muted/30">
                                    <div className="flex gap-2">
                                        <Input value={exp.role} onChange={(e) => updateExp(i, "role", e.target.value)} placeholder="Role" className="flex-1" />
                                        <Input value={exp.company} onChange={(e) => updateExp(i, "company", e.target.value)} placeholder="Company" className="flex-1" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Input value={exp.startDate} onChange={(e) => updateExp(i, "startDate", e.target.value)} placeholder="Start (e.g. Jan 2023)" className="flex-1" />
                                        <Input value={exp.endDate} onChange={(e) => updateExp(i, "endDate", e.target.value)} placeholder="End (or Present)" className="flex-1" />
                                    </div>
                                    <Input value={exp.description} onChange={(e) => updateExp(i, "description", e.target.value)} placeholder="Brief description" />
                                    <Button size="sm" variant="ghost" onClick={() => removeExperience(i)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <div className="mt-0.5 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Briefcase className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{exp.role}</p>
                                        <p className="text-xs text-muted-foreground">{exp.company} · {exp.startDate} – {exp.endDate || "Present"}</p>
                                        {exp.description && <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>}
                                    </div>
                                </div>
                            )}
                            {i < (editing ? experience : profile.experience).length - 1 && <Separator className="mt-3" />}
                        </div>
                    ))}
                    {!editing && profile.experience?.length === 0 && (
                        <p className="text-xs text-muted-foreground">No experience added yet.</p>
                    )}
                </CardContent>
            </Card>

            {/* Education */}
            <Card className="border-border/60">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />Education
                    </CardTitle>
                    {editing && (
                        <Button size="sm" variant="ghost" onClick={addEducation}><Plus className="h-4 w-4 mr-1" />Add</Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {(editing ? education : profile.education)?.map((edu, i) => (
                        <div key={i}>
                            {editing ? (
                                <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-muted/30">
                                    <Input value={edu.insitution} onChange={(e) => updateEdu(i, "insitution", e.target.value)} placeholder="Institution" />
                                    <div className="flex gap-2">
                                        <Input value={edu.degree} onChange={(e) => updateEdu(i, "degree", e.target.value)} placeholder="Degree" className="flex-1" />
                                        <Input value={edu.fieldOfStudy} onChange={(e) => updateEdu(i, "fieldOfStudy", e.target.value)} placeholder="Field of Study" className="flex-1" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Input value={edu.startYear} onChange={(e) => updateEdu(i, "startYear", e.target.value)} placeholder="Start Year" className="flex-1" />
                                        <Input value={edu.endYear} onChange={(e) => updateEdu(i, "endYear", e.target.value)} placeholder="End Year" className="flex-1" />
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => removeEducation(i)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <div className="mt-0.5 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <GraduationCap className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{edu.degree} — {edu.fieldOfStudy}</p>
                                        <p className="text-xs text-muted-foreground">{edu.insitution} · {edu.startYear} – {edu.endYear || "Present"}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {!editing && profile.education?.length === 0 && (
                        <p className="text-xs text-muted-foreground">No education added yet.</p>
                    )}
                </CardContent>
            </Card>

            {/* Social Links & GitHub */}
            <Card className="border-border/60">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Links</CardTitle>
                </CardHeader>
                <CardContent>
                    {editing ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Github className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <Input value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} placeholder="GitHub username" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Linkedin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <Input value={socialLinks.linkedin} onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })} placeholder="LinkedIn URL" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Twitter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <Input value={socialLinks.twitter} onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })} placeholder="Twitter / X handle" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <Input value={socialLinks.website} onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })} placeholder="Website URL" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {profile.githubUsername && (
                                <a href={`https://github.com/${encodeURIComponent(profile.githubUsername)}`} target="_blank" rel="noopener noreferrer">
                                    <Badge variant="outline" className="gap-1.5 hover:bg-accent cursor-pointer"><Github className="h-3.5 w-3.5" />{profile.githubUsername}</Badge>
                                </a>
                            )}
                            {profile.socialLinks?.linkedin && (
                                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                                    <Badge variant="outline" className="gap-1.5 hover:bg-accent cursor-pointer"><Linkedin className="h-3.5 w-3.5" />LinkedIn</Badge>
                                </a>
                            )}
                            {profile.socialLinks?.twitter && (
                                <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                                    <Badge variant="outline" className="gap-1.5 hover:bg-accent cursor-pointer"><Twitter className="h-3.5 w-3.5" />Twitter</Badge>
                                </a>
                            )}
                            {profile.socialLinks?.website && (
                                <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer">
                                    <Badge variant="outline" className="gap-1.5 hover:bg-accent cursor-pointer"><Globe className="h-3.5 w-3.5" />Website</Badge>
                                </a>
                            )}
                            {!profile.githubUsername && !profile.socialLinks?.linkedin && !profile.socialLinks?.twitter && !profile.socialLinks?.website && (
                                <p className="text-xs text-muted-foreground">No links added yet.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
