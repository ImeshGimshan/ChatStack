import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [ConversationService, PrismaService],
  controllers: [ConversationController],
  exports: [ConversationService],
})
export class ConversationModule {}
