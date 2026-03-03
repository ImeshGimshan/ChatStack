import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async markChannelMessageRead(messageId: bigint, userId: bigint) {
    return this.prisma.channelMessageReadReceipt.upsert({
      where: {
        userId_messageId: {
          messageId,
          userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId,
        userId,
        readAt: new Date(),
      },
    });
  }

  async markConversationMessageRead(messageId: bigint, userId: bigint) {
    return this.prisma.conversationMessageReadReceipt.upsert({
      where: {
        userId_messageId: {
          messageId,
          userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId,
        userId,
        readAt: new Date(),
      }
    });
  }

  async getChannelUnreadCount(channelId: bigint, userId: bigint) {
    const unreadCount = await this.prisma.channelMessage.count({
      where: {
        channelId,
        senderId: {
          not: userId,
        },
        readReceipts: {
          none: {
            userId,
          },
        },
      },
    });
    return unreadCount;
  }
  
  async getConversationUnreadCount(conversationId: bigint, userId: bigint) {
    const unreadCount = await this.prisma.conversationMessage.count({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        readReceipts: {
          none: {
            userId,
          },
        },
      },
    });
    return unreadCount;
  }

  async getChannelMessageReadReceipts(messageId: bigint) {
    return this.prisma.channelMessageReadReceipt.findMany({
      where: { messageId },
      include: {
        user: true,
      },
    });
  }

  async getConversationMessageReadReceipts(messageId: bigint) {
    return this.prisma.conversationMessageReadReceipt.findMany({
      where: { messageId },
      include: {
        user: true,
      },
    });
  }

  async getUserUnreadChannelMessages(userId: bigint) {
    return this.prisma.channelMessage.findMany({
      where: {
        senderId: {
          not: userId,
        },
        readReceipts: {
          none: {
            userId,
          },
        },
      },
      include: {
        sender: true,
        channel: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserUnreadConversationMessages(userId: bigint) {
    return this.prisma.conversationMessage.findMany({
      where: {
        senderId: {
          not: userId,
        },
        readReceipts: {
          none: {
            userId,
          },
        },
      },
      include: {
        sender: true,
        conversation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
