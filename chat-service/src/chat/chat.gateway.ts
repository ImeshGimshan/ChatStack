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
import { ChannelsService } from 'src/channel/Channels.Service';
import { ConversationService } from 'src/conversation/conversation.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  nameSpace: '/chat',
})

@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  constructor(
    private chatService: ChatService,
    private channelService: ChannelsService,
    private conversationService: ConversationService,
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

    if (!userId) {
      client.disconnect();
      return;
    }

    client.join(`user-${userId}`);
    console.log(`✅ Client connected: ${client.id} (User: ${username})`);

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

    this.server.emit('user-online', {
      userId,
      username,
      timestamp: new Date(),
    });
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

  // channel subcriptions
  @SubscribeMessage('join-channel')
  async handleJoinChannel (
    @ConnectedSocket() client: Socket,
    @MessageBody('channelId') channelId: string,
  ) {
    const userId = client.data.user.sub;
    if(!channelId) {
      return client.emit('error', { message: 'Channel ID is required' });
    }
    try {
      const channel = await this.channelService.getChannelById(BigInt(channelId));
      if (!channel) {
        return client.emit('error', { message: 'Channel not found' });
      }

      client.join(`channel-${channelId}`);
      console.log(`User ${userId} joined channel ${channelId}`);

      this.server.to(`channel-${channelId}`).emit('joined-channel', { 
        userId,
        channelId,
        timestamp: new Date(),
       });
    } catch (error) {
      console.error('Error joining channel:', error);
      client.emit('error', { message: 'Failed to join channel' });
    }
  }

  @SubscribeMessage('leave-channel')
  async handleLeaveChannel (
    @ConnectedSocket() client: Socket,
    @MessageBody('channelId') channelId: string,
  ) {
    const userId = client.data.user.sub;
    if(!channelId) {
      return client.emit('error', { message: 'Channel ID is required' });
    }

    client.leave(`channel-${channelId}`);
    console.log(`User ${userId} left channel ${channelId}`);

    this.server.to(`channel-${channelId}`).emit('left-channel', {
      userId,
      channelId,
      timestamp: new Date(),
     });
  }

  // channel messaging
  @SubscribeMessage('send-channel-message')
  async handleSendChannelMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string; content: string; isEncrypted?: boolean },
  ) {
    const senderId = client.data.user.sub;
    if(!payload.channelId || !payload.content) {
      return client.emit('error', { message: 'Channel ID and content are required' });
    }

    try  {
      const message = await this.channelService.sendMessage(
        BigInt(payload.channelId),  
        BigInt(senderId),
        payload.content,
        payload.isEncrypted ?? false,
      );

      this.server.to(`channel-${payload.channelId}`).emit('new-channel-message', {
        id: message.id,
        channelId: payload.channelId,
        senderId,
        content: message.content,
        isEncrypted: message.isEncrypted,
        createdAt: message.createdAt,
      });
    } catch (error: any) {
      console.error('Error sending channel message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('edit-channel-message')
  async handleEditChannelMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string; messageId: string; newContent: string },
  ) {
    const editorId = client.data.user.sub;
    if(!payload.channelId || !payload.newContent) {
      return client.emit('error', { message: 'Channel ID and new content are required' });
    }

    try {
      const message = await this.channelService.editMessage(
        BigInt(payload.messageId),
        BigInt(editorId), 
        payload.newContent,
      );

      this.server.to(`channel-${payload.channelId}`).emit('edited-channel-message', {
        id: message.id,
        channelId: payload.channelId,
        newContent: message.content,
        isEdited: message.isEdited,
        updatedAt: message.updatedAt,
      });
    } catch (error: any) {
      console.error('Error editing channel message:', error);
      client.emit('error', { message: 'Failed to edit message' });
    }
  }

  @SubscribeMessage('delete-channel-message')
  async handleDeleteChannelMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string; messageId: string },
  ) {
    const requesterId = client.data.user.sub;
    if(!payload.channelId) {
      return client.emit('error', { message: 'Channel ID is required' });
    }

    try {
      await this.channelService.deleteMessage(
        BigInt(payload.messageId),
        BigInt(requesterId),
      );

      this.server.to(`channel-${payload.channelId}`).emit('deleted-channel-message', {
        id: payload.messageId,
        channelId: payload.channelId,
      });
    } catch (error: any) {
      console.error('Error deleting channel message:', error);
      client.emit('error', { message: 'Failed to delete message' });
    }
  }

  // conersation DM subcriptions
  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ) {
    const userId = client.data.user.sub;
    if(!conversationId) {
      return client.emit('error', { message: 'Conversation ID is required' });
    }

    try {
      client.join(`conversation-${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);

      this.server.to(`conversation-${conversationId}`).emit('joined-conversation', {
        userId,
        conversationId,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error('Error joining conversation:', error);
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('leave-conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ) {
    const userId = client.data.user.sub;
    if(!conversationId) {
      return client.emit('error', { message: 'Conversation ID is required' });
    }

    client.leave(`conversation-${conversationId}`);
    console.log(`User ${userId} left conversation ${conversationId}`);

    this.server.to(`conversation-${conversationId}`).emit('left-conversation', {
      userId,
      conversationId,
      timestamp: new Date(),
    });
  }

  // conversation messaging
  @SubscribeMessage('send-conversation-message')
  async handleSendConversationMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; content: string; isEncrypted?: boolean },
  ) {
    const senderId = client.data.user.sub;

    if(!payload.conversationId || !payload.content) {
      return client.emit('error', { message: 'Conversation ID and content are required' });
    }

    try {
      const message = await this.conversationService.sendMessage(
        BigInt(payload.conversationId),
        BigInt(senderId),
        payload.content,
        payload.isEncrypted ?? false,
      );

      this.server.to(`conversation-${payload.conversationId}`).emit('new-conversation-message', {
        id: message.id,
        conversationId: payload.conversationId,
        senderId,
        content: message.content,
        isEncrypted: message.isEncrypted,
        createdAt: message.createdAt,
      });
    } catch (error: any) {
      console.error('Error sending conversation message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('edit-conversation-message')
  async handleEditConversationMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; messageId: string; newContent: string },
  ) {
    const editorId = client.data.user.sub;
    if(!payload.conversationId || !payload.newContent) {
      return client.emit('error', { message: 'Conversation ID and new content are required' });
    }

    try {
      const message = await this.conversationService.editMessage(
        BigInt(payload.messageId),
        BigInt(editorId),
        payload.newContent,
      );

      this.server.to(`conversation-${payload.conversationId}`).emit('edited-conversation-message', {
        id: message.id,
        conversationId: payload.conversationId,
        newContent: message.content,
        isEdited: message.isEdited,
        updatedAt: message.updatedAt,
      });
    } catch (error: any) {
      console.error('Error editing conversation message:', error);
      client.emit('error', { message: 'Failed to edit message' });
    }
  }

  @SubscribeMessage('delete-conversation-message')
  async handleDeleteConversationMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; messageId: string },
  ) {
    const requesterId = client.data.user.sub;
    if(!payload.conversationId) {
      return client.emit('error', { message: 'Conversation ID is required' });
    }
    try{
      await this.conversationService.deleteMessage(
        BigInt(payload.messageId),
        BigInt(requesterId),
      );
      this.server.to(`conversation-${payload.conversationId}`).emit('deleted-conversation-message', {
        id: payload.messageId,
        conversationId: payload.conversationId,
      });
    } catch (error: any) {
      console.error('Error deleting conversation message:', error);
      client.emit('error', { message: 'Failed to delete message' });
    }
  }

  // typing indicators
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; channelId: string;isTyping: boolean },
  ) {
    const userId = client.data.user.sub;
    const roomId = payload.conversationId || payload.channelId;
    const roomType = payload.conversationId ? 'conversation' : 'channel';

    if(!roomId) {
      return client.emit('error', { message: 'Conversation ID or Channel ID is required' });
    }

    const key = `typing:${roomType}:${roomId}:${userId}`;

    if(payload.isTyping) {
      await this.redis.setex(key,3, 'true');
      client.to(`${roomType}-${roomId}`).emit('typing', {
        userId,
        roomId,
        roomType,
        isTyping: true,
      });
    } else {
      await this.redis.del(key);
      client.to(`${roomType}-${roomId}`).emit('typing', {
        userId,
        roomId,
        roomType,
        isTyping: false,
      });
    }
  }
}
