"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { useGeneralChannel } from "@/hooks/useGeneralChannel";
import { channelService, ChannelMessage } from "@/services/channel.service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import PostFeed from "@/components/feed/PostFeed";
import NetworkTab from "@/components/network/NetworkTab";
import { Message } from "@/lib/types";
import {
    MessageSquare, Rss, LogOut, Hash, Users,
} from "lucide-react";
import { authService } from "@/services/auth.service";

type ActiveTab = "chat" | "feed" | "network";

/** Map backend ChannelMessage shape → frontend Message shape */
function mapMessage(raw: ChannelMessage, currentUserId: string, currentUsername: string): Message {
    return {
        sender: String(raw.senderId) === currentUserId ? currentUsername : `User ${raw.senderId}`,
        text: raw.content,
        timestamp: raw.createdAt,
    };
}

export default function ChatPageComponent() {
    const { socket, isConnected } = useSocket();
    const { user, loading } = useAuth();
    const router = useRouter();
    const { channel, loading: channelLoading } = useGeneralChannel();

    const [messages, setMessages] = useState<Message[]>([]);
    const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, user, router]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (activeTab === "chat") {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, activeTab]);

    // Join channel + fetch history once socket and channel are both ready
    useEffect(() => {
        if (!socket || !channel || !user) return;

        socket.emit("join-channel", { channelId: channel.id });

        channelService
            .getMessages(channel.id)
            .then((msgs) => {
                setMessages(msgs.map((m) => mapMessage(m, String(user.id), user.username)));
            })
            .catch((err) => console.error("Failed to load history:", err));
    }, [socket, channel, user]);

    // Listen for new channel messages
    useEffect(() => {
        if (!socket || !user) return;

        const handleNewMessage = (raw: ChannelMessage) => {
            setMessages((prev) => [...prev, mapMessage(raw, String(user.id), user.username)]);
        };

        const handleException = (err: { message: string }) => {
            console.error("Socket exception:", err.message || err);
        };

        socket.on("new-channel-message", handleNewMessage);
        socket.on("exception", handleException);

        return () => {
            socket.off("new-channel-message", handleNewMessage);
            socket.off("exception", handleException);
        };
    }, [socket, user]);

    const handleSendMessage = (text: string) => {
        if (socket && channel && text.trim()) {
            socket.emit("send-channel-message", { channelId: channel.id, content: text });
        }
    };

    const handleLogout = () => {
        authService.logout();
    };



    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 animate-pulse" />
                    <p className="text-sm text-muted-foreground">Loading ChatStack...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const navItems: { id: ActiveTab; icon: React.ReactNode; label: string }[] = [
        { id: "chat", icon: <MessageSquare className="h-5 w-5" />, label: "General Chat" },
        { id: "feed", icon: <Rss className="h-5 w-5" />, label: "Social Feed" },
        { id: "network", icon: <Users className="h-5 w-5" />, label: "Network" },
    ];

    // Group consecutive messages from same sender
    const shouldShowAvatar = (index: number) => {
        if (index === 0) return true;
        return messages[index].sender !== messages[index - 1].sender;
    };

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* ─── LEFT ICON RAIL ─────────────────────────────────── */}
            <aside className="flex w-16 flex-col items-center gap-1 border-r border-border/60 bg-card py-3">
                {/* Logo */}
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30">
                    <MessageSquare className="h-5 w-5 text-primary-foreground" />
                </div>

                <div className="h-px w-8 bg-border/60 mb-1" />

                {/* Nav icons */}
                <div className="flex flex-col gap-1 flex-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            title={item.label}
                            className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 group
                                ${activeTab === item.id
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                }`}
                        >
                            {item.icon}
                            {/* Active indicator pill */}
                            {activeTab === item.id && (
                                <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                            )}
                            {/* Tooltip */}
                            <span className="absolute left-14 whitespace-nowrap rounded-md bg-popover text-popover-foreground px-2 py-1 text-xs shadow-md border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Logout at bottom */}
                <button
                    onClick={handleLogout}
                    title="Logout"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all group relative"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="absolute left-14 whitespace-nowrap rounded-md bg-popover text-popover-foreground px-2 py-1 text-xs shadow-md border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        Logout
                    </span>
                </button>
            </aside>

            {/* ─── MAIN CONTENT ──────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── CHAT TAB ───────────────────────────────────── */}
                {activeTab === "chat" && (
                    <>
                        {/* Channels sidebar */}
                        <aside className="hidden md:flex w-60 flex-col border-r border-border/60 bg-card/70">
                            <div className="px-4 py-3 border-b border-border/60">
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    Channels
                                </h2>
                            </div>
                            <div className="p-2">
                                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                                    <Hash className="h-4 w-4" />
                                    general
                                </div>
                            </div>
                            <div className="mt-auto border-t border-border/60 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate">{user.username}</p>
                                        <p className="text-xs text-muted-foreground">Online</p>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Chat area */}
                        <div className="flex flex-1 flex-col overflow-hidden">
                            {/* Chat header */}
                            <header className="flex h-14 items-center gap-3 border-b border-border/60 px-5 flex-shrink-0 bg-background/80 backdrop-blur-sm">
                                <Hash className="h-5 w-5 text-muted-foreground" />
                                <span className="font-semibold">general</span>
                                <div className="h-4 w-px bg-border ml-1" />
                                <span className="text-xs text-muted-foreground">General chat for everyone</span>
                                <div className="ml-auto flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <Badge variant="secondary" className="text-xs">
                                        {isConnected ? "Connected" : "Connecting..."}
                                    </Badge>
                                </div>
                            </header>

                            {/* Messages */}
                            <ScrollArea className="flex-1 px-4">
                                <div className="py-4 space-y-1">
                                    {messages.length === 0 ? (
                                        <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                                            <div className="rounded-full bg-muted p-5">
                                                <Hash className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">Welcome to #general!</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    This is the start of the conversation. Say hello!
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        messages.map((msg, i) => (
                                            <MessageBubble
                                                key={i}
                                                message={msg}
                                                isCurrentUser={msg.sender === user.username}
                                                showAvatar={shouldShowAvatar(i)}
                                            />
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            {/* Message input */}
                            <MessageInput
                                onSend={handleSendMessage}
                                disabled={!isConnected || channelLoading}
                                placeholder={!isConnected ? "Connecting..." : channelLoading ? "Setting up channel..." : "Message #general"}
                            />
                        </div>
                    </>
                )}

                {/* ── FEED TAB ───────────────────────────────────── */}
                {activeTab === "feed" && (
                    <div className="flex flex-1 gap-5 overflow-hidden p-5">
                        {/* Main feed */}
                        <ScrollArea className="flex-1">
                            <div className="max-w-2xl mx-auto pb-8">
                                <div className="flex items-center gap-2 mb-5">
                                    <Rss className="h-5 w-5 text-primary" />
                                    <h1 className="text-xl font-bold">Social Feed</h1>
                                </div>
                                <PostFeed />
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {/* ── NETWORK TAB ────────────────────────────────── */}
                {activeTab === "network" && (
                    <div className="flex-1 overflow-hidden">
                        <NetworkTab />
                    </div>
                )}
            </div>
        </div>
    );
}