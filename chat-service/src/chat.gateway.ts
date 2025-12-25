import { UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { WsAuthGuard } from "./auth/WsAuth.guard";
import { Server, Socket } from "socket.io";

@WebSocketGateway(
    {
        cors: {
            origin: 'http://localhost:3000',
            credentials: true,
        }
    }
)

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket, ...args: any[]): void {
        // Optionally handle new connection logic here
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket): void {
        // Optionally handle disconnect logic here
        console.log(`Client disconnected: ${client.id}`);
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('send_message')
    // connectedSocket gives full object of client including user info and messageBody gives the actual message payload
    handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: {text: string}) : void {
        // extract who you are from verified token
        const senderName = client['user']?.sub || 'Unknown';

        // create a res opbject to send back to clients
        const response = {
            sender: senderName,
            text: payload.text || 'empty message',
            timestamp: new Date().toISOString(),
        }

        // broadcast message to all connected clients
        this.server.emit('receive_message', response);
    }
}