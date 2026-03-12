"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userService, ProfileCard } from "@/services/user.service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UserCardProps {
    userId: number;
    actions?: React.ReactNode;
    subtitle?: string;
    compact?: boolean;
}

export default function UserCard({ userId, actions, subtitle, compact }: UserCardProps) {
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<ProfileCard | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        userService.getProfileByUserId(userId)
            .then((p) => setProfile({ userId: p.userId, username: p.username, headline: p.headline, avatarUrl: p.avatarUrl, skills: p.skills, openToCollaboration: p.openToCollaboration }))
            .catch(() => setProfile({ userId, username: `User ${userId}`, headline: "", avatarUrl: null, skills: [], openToCollaboration: false }))
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-40" />
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const isMe = currentUser?.id === userId;

    return (
        <div className={`flex items-center gap-3 ${compact ? "py-2" : "p-3"}`}>
            <Avatar className="h-10 w-10 border border-border/60">
                <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                    {profile.username?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">{profile.username}{isMe && " (You)"}</p>
                    {profile.openToCollaboration && (
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" title="Open to Collaborate" />
                    )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{subtitle || profile.headline || "ChatStack member"}</p>
                {!compact && profile.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {profile.skills.slice(0, 4).map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
                        ))}
                        {profile.skills.length > 4 && <span className="text-[10px] text-muted-foreground">+{profile.skills.length - 4}</span>}
                    </div>
                )}
            </div>
            {actions && <div className="flex items-center gap-1.5 flex-shrink-0">{actions}</div>}
        </div>
    );
}
