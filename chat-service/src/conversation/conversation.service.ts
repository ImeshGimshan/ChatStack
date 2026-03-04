import { BadRequestException, Injectable } from '@nestjs/common';
import { EncryptionService } from 'src/encryption/encryption.service';
import { KeyService } from 'src/encryption/keys/key.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private keyService: KeyService,
  ) {}

  async createConversation(userIds: bigint[], name?: string) {
    return this.prisma.conversation.create({
      data: {
        name,
        isGroup: userIds.length > 2,
        members: {
          create: userIds.map((userIds) => ({
            userId: userIds,
          })),
        },
      },
      include: {
        members: true,
      },
    });
  }

  async getConversationsForUser(userId: bigint) {
    return this.prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: true,
      },
    });
  }

  async sendMessage(
    conversationId: bigint,
    senderId: bigint,
    content: string,
    isEncrypted: boolean = false,
  ) {
    try {
      let messageContent = content;
      if (isEncrypted) {
        const memebers = await this.prisma.conversationMember.findMany({
          where: { conversationId },
          include: { user: true },
        });

        const recipient = memebers.find((m) => m.userId !== senderId);
        if (!recipient) {
          throw new BadRequestException('No recipient found for encryption');
        }

        const recipientKey = await this.keyService.getUserPublicKey(
          recipient.userId,
        );
        if (!recipientKey) {
          throw new BadRequestException('Recipient does not have a public key');
        }
        messageContent = this.encryptionService.encryptMessage(
          content,
          recipientKey,
        );
      }
      const message = await this.prisma.conversationMessage.create({
        data: {
          conversationId,
          senderId,
          content: messageContent,
          isEncrypted,
        },
      });
      console.log('Message sent:', message);
      return message;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new BadRequestException(error.message || 'Failed to send message');
    }
  }

  async getMessages(conversationId: bigint, limit = 50) {
    return this.prisma.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async editMessage(messageId: bigint, editorId: bigint, newContent: string) {
    return this.prisma.conversationMessage.update({
      where: { id: messageId },
      data: {
        content: newContent,
        isEdited: true,
        updatedAt: new Date(),
      },
    });
  }

  async deleteMessage(messageId: bigint, requesterId: bigint) {
    return this.prisma.conversationMessage.update({
      where: { id: messageId },
      data: {
        content: '[deleted]',
        isDeleted: true,
        updatedAt: new Date(),
      },
    });
  }
}
