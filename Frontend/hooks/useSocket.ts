"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = Cookies.get("token") || localStorage.getItem("authToken");
        if (!token) {
            console.log("No token found — skipping socket connection.");
            return;
        }

        const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_API || "http://localhost:3333";

        const socketInstance = io(`${CHAT_URL}/chat`, {
            auth: { token },
            // Try polling first (more reliable on AWS ALB/nginx), then upgrade to WS
            transports: ["polling", "websocket"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socketInstance.on("connect", () => {
            console.log("✅ Socket connected:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on("disconnect", (reason) => {
            console.warn("❌ Socket disconnected:", reason);
            setIsConnected(false);
        });

        socketInstance.on("connect_error", (err) => {
            console.error("❌ Socket connect_error:", err.message);
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return { socket, isConnected };
};