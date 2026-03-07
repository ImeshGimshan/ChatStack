import { BadRequestException, Injectable } from '@nestjs/common';
import { EncryptionService } from 'src/encryption/encryption.service';
import { KeyService } from 'src/encryption/keys/key.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChannelsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private keyService: KeyService,
  ) {}

  async getChannelsForServer(serverId: bigint) {
    return this.prisma.channel.findMany({
      where: { serverId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getMyChannels(userId: bigint) {
    const memberships = await this.prisma.channelMember.findMany({
      where: { userId },
      include: { channel: true },
      orderBy: { joinedAt: 'desc' },
    });
    return memberships.map((m) => m.channel);
  }

  async createChannel(serverId: bigint, name: string, description: string) {
    return this.prisma.channel.create({
      data: {
        serverId,
        name,
        description,
      },
    });
  }

  async getChannelById(channelId: bigint) {
    return this.prisma.channel.findUnique({
      where: { id: channelId },
    });
  }

  async deleteChannel(channelId: bigint) {
    return this.prisma.channel.delete({
      where: { id: channelId },
    });
  }

  async addMember(channelId: bigint, userId: bigint) {
    return this.prisma.channelMember.create({
      data: {
        channelId,
        userId,
      },
    });
  }

  async removeMember(channelId: bigint, userId: bigint) {
    return this.prisma.channelMember.delete({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });
  }

  async listMembers(channelId: bigint) {
    return this.prisma.channelMember.findMany({
      where: { channelId },
      include: {
        user: true,
      },
    });
  }

  async sendMessage(
    channelId: bigint,
    senderId: bigint,
    content: string,
    isEncrypted: boolean = false,
  ) {
    try {
      let messageContent = content;
      if (isEncrypted) {
        const members = await this.prisma.channelMember.findMany({
          where: { channelId },
          include: {
            user: true,
          },
        });

        if (members.length === 0) {
          throw new BadRequestException('No members in channel');
        }

        const recipient = members.find((m) => m.userId !== senderId);
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
      const message = await this.prisma.channelMessage.create({
        data: {
          channelId,
          senderId,
          content: messageContent,
          isEncrypted,
        },
      });
      console.log('Message sent:', message);
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessages(channelId: bigint, limit = 50) {
    return this.prisma.channelMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async editMessage(messageId: bigint, editorId: bigint, newContent: string) {
    return this.prisma.channelMessage.update({
      where: { id: messageId },
      data: {
        content: newContent,
        isEdited: true,
        updatedAt: new Date(),
      },
    });
  }

  async deleteMessage(messageId: bigint, requesterId: bigint) {
    return this.prisma.channelMessage.update({
      where: { id: messageId },
      data: {
        content: '[Message deleted]',
        isDeleted: true,
        updatedAt: new Date(),
      },
    });
  }

  async addReaction(messageId: bigint, userId: bigint, emoji: string) {
    return this.prisma.messageReaction.create({
      data: {
        channelMessageId: messageId,
        userId,
        emoji,
      },
    });
  }

  async removeReaction(messageId: bigint, userId: bigint, emoji: string) {
    return this.prisma.messageReaction.delete({
      where: {
        userId_channelMessageId_emoji: {
          channelMessageId: messageId,
          userId,
          emoji,
        },
      },
    });
  }

  async listReactions(messageId: bigint) {
    return this.prisma.messageReaction.findMany({
      where: { channelMessageId: messageId },
      include: {
        user: true,
      },
    });
  }
}
