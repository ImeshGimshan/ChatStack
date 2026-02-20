import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { WsAuthGuard } from '../auth/WsAuth.guard';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

@WebSocketGateway({
  cors: {
    origin: '*',
    nameSpace: '/chat',
  },
})
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  constructor(
    private chatService: ChatService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  afterInit(server: Server) {
    const pubClient = this.redis.duplicate();
    const subClient = this.redis.duplicate();

    server.adapter(createAdapter(pubClient, subClient));

    console.log('ChatGateway initialized with Redis adapter');
  }

  async handleConnection(client: Socket) {
    const userId = client.data.user?.sub;
    const username = client.data.user?.username;

    if (userId) {
      client.join(`user-${userId}`);
      console.log(
        `Client connected: ${client.id} (User ID: ${userId}, Username: ${username})`,
      );

      await this.redis.setex(
        `user-online: ${userId}`,
        3600,
        JSON.stringify({
          userId,
          username,
          socketId: client.id,
          connectedAt: new Date().toISOString(),
        }),
      );

      console.log(`User ${username} (ID: ${userId}) is now online.`);

      this.server.emit('user-online', {
        userId,
        username,
        timestamp: new Date(),
      });
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub;
    const username = client.data.user?.username;

    if (userId) {
      await this.redis.del(`user-online: ${userId}`);
      console.log(`❌ Client disconnected: ${client.id} (User: ${username})`);

      this.server.emit('user-offline', {
        userId,
        username,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    client: Socket,
    payload: { conversationId: String; isTyping: boolean },
  ) {
    const userId = client.data.user.sub;
    const key = `typing:${payload.conversationId}: ${userId}`;

    if (payload.isTyping) {
      await this.redis.set(key, 'true', 'EX', 3);
      client
        .to(`conversation-${payload.conversationId}`)
        .emit('typing', { userId, isTyping: true });
    } else {
      await this.redis.del(key);
      client
        .to(`conversation-${payload.conversationId}`)
        .emit('typing', { userId, isTyping: false });
    }
  }
}
