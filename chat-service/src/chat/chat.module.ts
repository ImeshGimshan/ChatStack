import { PrismaModule } from 'src/prisma/prisma.module';
import { ChatGateway } from './chat.gateway';
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthModule } from 'src/auth/auth.module';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
    imports: [
        RedisModule.forRoot({
            type: 'single',
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
        PrismaModule,
        AuthModule
    ],
    providers: [ChatGateway, ChatService],
})
export class ChatModule {}
