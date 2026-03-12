"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { socialService, Connection } from "@/services/social.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserMinus } from "lucide-react";
import { toast } from "sonner";
import UserCard from "./UserCard";

export default function MyConnections() {
    const { user } = useAuth();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const data = await socialService.getMyConnections();
            setConnections(data);
        } catch {
            toast.error("Failed to load connections");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (conn: Connection) => {
        try {
            await socialService.removeConnection(conn.id);
            setConnections((prev) => prev.filter((c) => c.id !== conn.id));
            toast.success("Connection removed");
        } catch {
            toast.error("Failed to remove connection");
        }
    };

    const getOtherUserId = (conn: Connection) =>
        conn.requesterId === user?.id ? conn.addresseeId : conn.requesterId;

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
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">My Connections</h2>
                <span className="text-xs text-muted-foreground">({connections.length})</span>
            </div>
            {connections.length === 0 ? (
                <Card className="border-border/60">
                    <CardContent className="py-12 text-center">
                        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No connections yet. Discover developers and start networking!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-1.5">
                    {connections.map((conn) => (
                        <Card key={conn.id} className="border-border/60 hover:border-primary/30 transition-colors">
                            <CardContent className="p-1">
                                <UserCard
                                    userId={getOtherUserId(conn)}
                                    actions={
                                        <Button size="sm" variant="ghost" onClick={() => handleRemove(conn)} className="text-muted-foreground hover:text-destructive">
                                            <UserMinus className="h-4 w-4" />
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
