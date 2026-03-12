"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { userService, ProfileCard, DiscoverResponse } from "@/services/user.service";
import { socialService, ConnectionStatus } from "@/services/social.service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserPlus, Check, Compass, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function DiscoverDevelopers() {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<ProfileCard[]>([]);
    const [searchResults, setSearchResults] = useState<ProfileCard[] | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [connectionStatuses, setConnectionStatuses] = useState<Record<number, ConnectionStatus>>({});
    const [sendingTo, setSendingTo] = useState<number | null>(null);

    useEffect(() => {
        loadPage(1);
    }, []);

    const loadPage = async (p: number) => {
        setLoading(true);
        try {
            const data = await userService.discoverProfiles(p, 12);
            setProfiles(data.profiles);
            setPage(data.page);
            setTotalPages(data.pages);
            loadStatuses(data.profiles.map((pr) => pr.userId));
        } catch {
            toast.error("Failed to load developers");
        } finally {
            setLoading(false);
        }
    };

    const loadStatuses = async (userIds: number[]) => {
        const filtered = userIds.filter((id) => id !== user?.id);
        const results = await Promise.allSettled(filtered.map((id) => socialService.getStatus(id)));
        const statuses: Record<number, ConnectionStatus> = {};
        filtered.forEach((id, i) => {
            const r = results[i];
            statuses[id] = r.status === "fulfilled" ? r.value.status : "NONE";
        });
        setConnectionStatuses((prev) => ({ ...prev, ...statuses }));
    };

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }
        setSearching(true);
        try {
            const results = await userService.searchUsers(searchQuery.trim());
            setSearchResults(results);
            loadStatuses(results.map((r) => r.userId));
        } catch {
            toast.error("Search failed");
        } finally {
            setSearching(false);
        }
    }, [searchQuery]);

    const handleConnect = async (targetId: number) => {
        setSendingTo(targetId);
        try {
            await socialService.sendRequest(targetId);
            setConnectionStatuses((prev) => ({ ...prev, [targetId]: "PENDING" }));
            toast.success("Connection request sent!");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to send request");
        } finally {
            setSendingTo(null);
        }
    };

    const displayProfiles = searchResults ?? profiles;

    const renderButton = (userId: number) => {
        if (userId === user?.id) return null;
        const status = connectionStatuses[userId];
        if (status === "ACCEPTED") return <Badge variant="secondary" className="text-xs"><Check className="h-3 w-3 mr-1" />Connected</Badge>;
        if (status === "PENDING") return <Badge variant="outline" className="text-xs">Pending</Badge>;
        return (
            <Button size="sm" onClick={() => handleConnect(userId)} disabled={sendingTo === userId} className="h-7 text-xs gap-1">
                <UserPlus className="h-3.5 w-3.5" />{sendingTo === userId ? "Sending..." : "Connect"}
            </Button>
        );
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Compass className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Discover Developers</h2>
            </div>

            {/* Search bar */}
            <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!e.target.value.trim()) setSearchResults(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search developers by username..."
                    className="pl-9 pr-20"
                />
                <Button size="sm" onClick={handleSearch} disabled={searching} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs">
                    {searching ? "..." : "Search"}
                </Button>
            </div>

            {/* Results */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
                </div>
            ) : displayProfiles.length === 0 ? (
                <Card className="border-border/60">
                    <CardContent className="py-12 text-center">
                        <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            {searchResults ? "No developers found matching your search." : "No developers to show yet."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {displayProfiles.map((dev) => (
                            <Card key={dev.userId} className="border-border/60 hover:border-primary/30 transition-all hover:shadow-md group">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-12 w-12 border border-border/60">
                                            <AvatarFallback className="text-base font-bold bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                                                {dev.username?.[0]?.toUpperCase() ?? "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-semibold truncate">{dev.username}</p>
                                                {dev.openToCollaboration && (
                                                    <Sparkles className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {dev.headline || "ChatStack developer"}
                                            </p>
                                        </div>
                                    </div>
                                    {dev.skills?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {dev.skills.slice(0, 5).map((s) => (
                                                <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
                                            ))}
                                            {dev.skills.length > 5 && <span className="text-[10px] text-muted-foreground">+{dev.skills.length - 5}</span>}
                                        </div>
                                    )}
                                    <div className="mt-3 flex justify-end">
                                        {renderButton(dev.userId)}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination (only for discover, not search) */}
                    {!searchResults && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => loadPage(page - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => loadPage(page + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
