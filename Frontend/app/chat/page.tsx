"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageSquare, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";

export default function ChatPage() {
    const socket = useSocket();
    const { user } = useAuth();

    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState<string>("");

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (message: any) => {
            setMessages((prev) => [...prev, message]);
        };

        socket.on("receive_message", handleMessage);

        socket.on("exception", (err) => {
            console.error("Socket exception detail:", err.message || err);
        });

        return () => {
            socket.off("receive_message", handleMessage);
        };
    }, [socket]);


    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (socket && input.trim()) {
            socket.emit("send_message", { text: input });
            setInput("");
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader className="space-y-3 pb-6">
                    <div className="flex items-center justify-center gap-2">
                        <MessageSquare className="h-8 w-8" />
                        <h1 className="text-3xl font-bold">ChatStack</h1>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Messages Area */}
                    <div className="h-96 overflow-y-auto rounded-lg border bg-muted/30 p-4">
                        <div className="flex flex-col gap-3">
                            {messages.map((message, i) => (
                                <div key={i} className="rounded-lg bg-background p-3 shadow-sm">
                                    <span className="font-semibold text-primary">
                                        {message.sender}:{" "}
                                    </span>
                                    <span className="text-foreground">{message.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="h-11 flex-1"
                            placeholder="Type a message..."
                        />
                        <Button
                            type="button"
                            onClick={sendMessage}
                            className="h-11 px-6"
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Send
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}