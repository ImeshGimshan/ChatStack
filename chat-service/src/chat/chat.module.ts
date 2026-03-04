import { PrismaModule } from 'src/prisma/prisma.module';
import { ChatGateway } from './chat.gateway';
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthModule } from 'src/auth/auth.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ChannelsModule } from 'src/channel/Channels.module';
import { ConversationModule } from 'src/conversation/conversation.module';
import { ChatController } from './chat.controller';
import { EncryptionModule } from 'src/encryption/encryption.module';

@Module({
  imports: [
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    PrismaModule,
    AuthModule,
    ChannelsModule,
    ConversationModule,
    EncryptionModule,
  ],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
