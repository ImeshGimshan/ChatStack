"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Hash, MessageSquare, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatPageComponent() {
    const socket = useSocket();
    const { user, loading } = useAuth();
    const router = useRouter();

    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        // Listen for incoming messages
        const handleMessage = (message: any) => {
            setMessages((prev) => [...prev, message]);
        };

        // Listen for exceptions
        const handleException = (err: any) => {
            console.error("Socket exception detail:", err.message || err);
        }

        socket.on("receive_message", handleMessage);
        socket.on("exception", handleException);

        // Fetch chat history on initial load
        socket.emit("get_history", (res: any) => {
            if (Array.isArray(res)) {
                setMessages(res);
            } else {
                console.error("Invalid chat history format:", res);
            }
        });

        // Clean up on unmount
        return () => {
            socket.off("receive_message", handleMessage);
            socket.off("exception", handleException);
        };
    }, [socket]);

    // Redirect to landing page if user is not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [loading, user, router]);


    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (socket && input.trim()) {
            socket.emit("send_message", { text: input });
            setInput("");
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatMessageTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();

        // Check if it's today
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Fallback for older messages
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
            ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex w-full items-center justify-center bg-background p-4">
            <Card className="w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl">
                <CardHeader className="border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <MessageSquare className="h-8 w-8 text-chart-6" />
                            <h1 className="text-4xl font-bold">ChatStack</h1>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full px-4 py-4">
                        <div className="flex flex-col gap-4">
                            {messages.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
                                    <div className="rounded-full bg-muted p-4">
                                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">No messages yet</h3>
                                        <p className="text-sm text-muted-foreground">Be the first to say hello!</p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message, i) => {
                                    const isCurrentUser = message.sender === user?.username;

                                    return (
                                        <div
                                            key={i}
                                            className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            
                                            {!isCurrentUser && (
                                                <Avatar className="h-10 w-10 bg-primary">
                                                    <AvatarFallback className="text-sm font-semibold bg-primary text-primary-foreground">
                                                        {getInitials(message.sender)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}

                                            <div className={`flex flex-col space-y-1 max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`text-xs font-semibold ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                                                        {isCurrentUser ? 'You' : message.sender}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatMessageTime(message.timestamp)}
                                                    </span>
                                                </div>
                                                <div className={`rounded-2xl px-4 py-2 ${isCurrentUser
                                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                    : 'bg-muted text-foreground rounded-tl-sm'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed break-words">
                                                        {message.text}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>
                </CardContent>

                <div className="border-t px-4 py-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="h-11"
                                placeholder="Message #general"
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={sendMessage}
                            disabled={!input.trim()}
                            className="h-11 px-6"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}