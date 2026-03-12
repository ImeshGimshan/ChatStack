"use client";
import { useEffect, useState } from "react";
import { socialService, Connection } from "@/services/social.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Check, X } from "lucide-react";
import { toast } from "sonner";
import UserCard from "./UserCard";

export default function PendingRequests() {
    const [requests, setRequests] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<number | null>(null);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const data = await socialService.getPendingRequests();
            setRequests(data);
        } catch {
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (conn: Connection) => {
        setActioningId(conn.id);
        try {
            await socialService.acceptRequest(conn.id);
            setRequests((prev) => prev.filter((r) => r.id !== conn.id));
            toast.success("Connection accepted!");
        } catch {
            toast.error("Failed to accept");
        } finally {
            setActioningId(null);
        }
    };

    const handleReject = async (conn: Connection) => {
        setActioningId(conn.id);
        try {
            await socialService.rejectRequest(conn.id);
            setRequests((prev) => prev.filter((r) => r.id !== conn.id));
            toast("Request declined");
        } catch {
            toast.error("Failed to decline");
        } finally {
            setActioningId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <UserPlus className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Pending Requests</h2>
                {requests.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {requests.length}
                    </span>
                )}
            </div>
            {requests.length === 0 ? (
                <Card className="border-border/60">
                    <CardContent className="py-12 text-center">
                        <UserPlus className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No pending requests right now.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-1.5">
                    {requests.map((req) => (
                        <Card key={req.id} className="border-border/60 hover:border-primary/30 transition-colors">
                            <CardContent className="p-1">
                                <UserCard
                                    userId={req.requesterId}
                                    subtitle={req.message || undefined}
                                    actions={
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                onClick={() => handleAccept(req)}
                                                disabled={actioningId === req.id}
                                                className="h-8 gap-1"
                                            >
                                                <Check className="h-3.5 w-3.5" />Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleReject(req)}
                                                disabled={actioningId === req.id}
                                                className="h-8 gap-1"
                                            >
                                                <X className="h-3.5 w-3.5" />Decline
                                            </Button>
                                        </div>
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
