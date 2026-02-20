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
    PermissionModule
  ],
})
export class AppModule {}
