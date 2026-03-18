import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

      async markChannelMessageRead(messageId: bigint, userId: bigint) {
    const targetMessage = await this.prisma.channelMessage.findUnique({
      where: { id: messageId },
      select: { channelId: true, createdAt: true },
    });
    if (!targetMessage) return null;

    const unreadMessages = await this.prisma.channelMessage.findMany({
      where: {
        channelId: targetMessage.channelId,
        createdAt: { lte: targetMessage.createdAt },
        senderId: { not: userId },
        readReceipts: { none: { userId } },
      },
      select: { id: true },
    });

    if (unreadMessages.length > 0) {
      await this.prisma.channelMessageReadReceipt.createMany({
        data: unreadMessages.map((m) => ({
          messageId: m.id,
          userId,
          readAt: new Date(),
        })),
        skipDuplicates: true,
      });
    }

    return this.prisma.channelMessageReadReceipt.findUnique({
      where: { userId_messageId: { messageId, userId } },
    });
  }

  async markConversationMessageRead(messageId: bigint, userId: bigint) {
    const targetMessage = await this.prisma.conversationMessage.findUnique({
      where: { id: messageId },
      select: { conversationId: true, createdAt: true },
    });
    if (!targetMessage) return null;

    const unreadMessages = await this.prisma.conversationMessage.findMany({
      where: {
        conversationId: targetMessage.conversationId,
        createdAt: { lte: targetMessage.createdAt },
        senderId: { not: userId },
        readReceipts: { none: { userId } },
      },
      select: { id: true },
    });

    if (unreadMessages.length > 0) {
      await this.prisma.conversationMessageReadReceipt.createMany({
        data: unreadMessages.map((m) => ({
          messageId: m.id,
          userId,
          readAt: new Date(),
        })),
        skipDuplicates: true,
      });
    }

    return this.prisma.conversationMessageReadReceipt.findUnique({
      where: { userId_messageId: { messageId, userId } },
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
