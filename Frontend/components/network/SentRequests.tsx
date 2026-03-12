"use client";
import { useEffect, useState } from "react";
import { socialService, Connection } from "@/services/social.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Undo2 } from "lucide-react";
import { toast } from "sonner";
import UserCard from "./UserCard";

export default function SentRequests() {
    const [requests, setRequests] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const data = await socialService.getSentRequests();
            setRequests(data);
        } catch {
            toast.error("Failed to load sent requests");
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (conn: Connection) => {
        try {
            await socialService.withdrawRequest(conn.id);
            setRequests((prev) => prev.filter((r) => r.id !== conn.id));
            toast("Request withdrawn");
        } catch {
            toast.error("Failed to withdraw");
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
                <Send className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Sent Requests</h2>
                <span className="text-xs text-muted-foreground">({requests.length})</span>
            </div>
            {requests.length === 0 ? (
                <Card className="border-border/60">
                    <CardContent className="py-12 text-center">
                        <Send className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">You haven&apos;t sent any requests.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-1.5">
                    {requests.map((req) => (
                        <Card key={req.id} className="border-border/60 hover:border-primary/30 transition-colors">
                            <CardContent className="p-1">
                                <UserCard
                                    userId={req.addresseeId}
                                    subtitle="Pending..."
                                    actions={
                                        <Button size="sm" variant="outline" onClick={() => handleWithdraw(req)} className="h-8 gap-1">
                                            <Undo2 className="h-3.5 w-3.5" />Withdraw
                                        </Button>
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
