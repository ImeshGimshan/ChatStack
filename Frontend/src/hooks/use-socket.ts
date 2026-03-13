"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const CHAT_SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_API || "http://localhost:3333";
const CHAT_SOCKET_NAMESPACE = "/chat";

type SocketStatus = "idle" | "connecting" | "connected" | "disconnected";

type UseSocketResult = {
  socket: Socket | null;
  status: SocketStatus;
  isConnected: boolean;
  lastError: string | null;
};

export function useSocket(token: string | null): UseSocketResult {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("idle");
      setLastError(null);

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      return;
    }

    setStatus("connecting");
    setLastError(null);

    const socket = io(`${CHAT_SOCKET_URL}${CHAT_SOCKET_NAMESPACE}`, {
      auth: {
        token
      },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    const onConnect = () => {
      setStatus("connected");
      setLastError(null);
    };

    const onDisconnect = () => {
      setStatus("disconnected");
    };

    const onConnectError = (error: Error) => {
      setStatus("disconnected");
      setLastError(error.message || "Connection failed");
    };

    const onError = (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error && "message" in error
            ? String((error as { message?: unknown }).message || "Socket error")
            : "Socket error";
      setLastError(message);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("error", onError);
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [token]);

  return useMemo(
    () => ({
      socket: socketRef.current,
      status,
      isConnected: status === "connected",
      lastError
    }),
    [status, lastError]
  );
}
