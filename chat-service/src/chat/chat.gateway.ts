import { UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { WsAuthGuard } from "../auth/WsAuth.guard";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../prisma/prisma.service";
import { ChatService } from "./chat.service";

@WebSocketGateway(
    {
        cors: {
            origin: '*',
            nameSpace: '/chat',
        }
    }
)
@UseGuards(WsAuthGuard)

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    constructor(private chatService: ChatService) { }

    async handleConnection(client: Socket) {
        const userId = client.data.user?.sub;
        const username = client.data.user?.username;

        if (userId) {
            client.join(`user-${userId}`);
            console.log(`Client connected: ${client.id} (User ID: ${userId}, Username: ${username})`);

            this.server.emit('user-online', { userId, username });
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data.user?.sub;
        const username = client.data.user?.username;

        if (!userId) {
            console.log(`Client disconnected: ${client.id} (Unknown user)`);

            this.server.emit('user-offline', { userId, username });
        }
    }

    @SubscribeMessage('send_message')
    async handleGetPrivateMessage(
        @MessageBody() data: {
            recipientId: string;
            encryptedMessage: string;
            senderPublicKey: string;
        },
        @ConnectedSocket() client: Socket,
    ) {
        const senderId = client.data.user.sub;
        const senderUsername = client.data.user.username;

        try {
            const message = await this.chatService.savePrivateMessage({
                senderId,
                recipientId: data.recipientId,
                text: data.encryptedMessage,
                isEncrypted: true,
            });

            this.server.to(`user-${data.recipientId}`).emit('private_message', {
                messageId: message.id,
                senderId,
                senderUsername,
                encryptedMessage: data.encryptedMessage,
                senderPublicKey: data.senderPublicKey,
                timestamp: message.timestamp,
            });

            return {
                success: true,
                messageId: message.id,
                timestamp: message.timestamp,
            };
        } catch (error) {
            console.error('Error saving private message:', error);
            return {
                success: false,
                error: 'Failed to save message',
            };
        }
    }

    @SubscribeMessage('message')
    async handleMessage(
        @MessageBody() data: {text: string},
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data.user.sub;
        const username = client.data.user.username || 'Anonymous';

        try {
            const message = await this.chatService.saveMessage(userId, data.text);

            this.server.emit('messsage', {
                id: message.id,
                senderId: message.senderId.toString(),
                senderUsername: username,
                text: message.text,
                timestamp: message.timestamp,
            });

            return {
                success: true,
                messageId: message.id
            };
        } catch (error) {
            console.error("Error sending mesage", error);

            return {
                success: false,
                error: "Failed to send message"
            };
        }
    }

    @SubscribeMessage('get-private-messages')
    async handleGetPrivateMessages(
        @MessageBody() data: { otherUserId: string },
        @ConnectedSocket() client: Socket,
    )
    {
        const userId = client.data.user.sub;

        try {
            const messages = await this.chatService.getPrivateMessages(userId, data.otherUserId);
            return {
                success: true,
                messages: messages.map(msg => ({
                    id: msg.id,
                    senderId: msg.senderId.toString(),
                    recipientId: msg.recipientId?.toString(),
                    text: msg.text,
                    isEncrypted: msg.isEncrypted,
                    timestamp: msg.timestamp,
                }))
            };
        } catch (error) {
            console.error("Error fetching private messages", error);
            return {
                success: false,
                error: 'Failed to fetch messages'
            };
        }
    }
}