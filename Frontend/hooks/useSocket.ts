import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import Cookies from "js-cookie";

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            console.log("No token found in cookies.");
            return;
        }

        const socketInstance = io('http://localhost:3333', {
            auth: { token },
            transports: ['websocket'],
        });

        socketInstance.on('connect', () => {
            console.log('✅ Connected to NestJS with ID:', socketInstance.id);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('❌ Connection error:', err.message);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return socket;
};