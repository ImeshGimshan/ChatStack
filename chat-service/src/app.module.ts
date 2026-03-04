import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PostModule } from './post/post.module';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { ChannelsModule } from './channel/Channels.module';
import { PermissionModule } from './permission/permission.module';
import { ServerModule } from './server/server.module';
import { ConversationModule } from './conversation/conversation.module';
import { EncryptionModule } from './encryption/encryption.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    PrismaModule,
    PostModule,
    ChatModule,
    CommentModule,
    ChannelsModule,
    PermissionModule,
    ServerModule,
    ConversationModule,
    EncryptionModule,
  ],
})
export class AppModule {}