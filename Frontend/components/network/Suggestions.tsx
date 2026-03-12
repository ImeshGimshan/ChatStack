"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { socialService, Suggestion } from "@/services/social.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import UserCard from "./UserCard";

export default function Suggestions() {
    const { user } = useAuth();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingTo, setSendingTo] = useState<number | null>(null);
    const [sentIds, setSentIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const data = await socialService.getSuggestions();
            setSuggestions(data);
        } catch {
            toast.error("Failed to load suggestions");
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (userId: number) => {
        setSendingTo(userId);
        try {
            await socialService.sendRequest(userId);
            setSentIds((prev) => new Set(prev).add(userId));
            toast.success("Connection request sent!");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to send request");
        } finally {
            setSendingTo(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">People You May Know</h2>
            </div>
            {suggestions.length === 0 ? (
                <Card className="border-border/60">
                    <CardContent className="py-12 text-center">
                        <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            Build your network first — suggestions appear when your connections have connections!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-1.5">
                    {suggestions.map((s) => (
                        <Card key={s.userId} className="border-border/60 hover:border-primary/30 transition-colors">
                            <CardContent className="p-1">
                                <UserCard
                                    userId={s.userId}
                                    subtitle={`${s.mutualConnections} mutual connection${s.mutualConnections === 1 ? "" : "s"}`}
                                    actions={
                                        sentIds.has(s.userId) ? (
                                            <Badge variant="outline" className="text-xs">Pending</Badge>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() => handleConnect(s.userId)}
                                                disabled={sendingTo === s.userId}
                                                className="h-8 gap-1"
                                            >
                                                <UserPlus className="h-3.5 w-3.5" />{sendingTo === s.userId ? "..." : "Connect"}
                                            </Button>
                                        )
                                    }
                                />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
