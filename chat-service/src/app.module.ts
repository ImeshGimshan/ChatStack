import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PostModule } from './post/post.module';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { KeysModule } from './encryption/keys/keys.module';
import { ChannelsModule } from './channel/Channels.module';
import { PermissionModule } from './permission/permission.module';
import { ServerModule } from './server/server.module';
import { ConversationService } from './conversation/conversation.service';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    PrismaModule,
    PostModule,
    ChatModule,
    PostModule,
    CommentModule,
    KeysModule,
    ChannelsModule,
    PermissionModule,
    ServerModule,
    ConversationModule,
  ],
  providers: [ConversationService],
})
export class AppModule {}
