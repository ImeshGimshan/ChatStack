import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  async getChannelsForServer(serverId: bigint) {
    return this.prisma.channel.findMany({
      where: { serverId },
      orderBy: {
        createdAt: 'asc',
      },
    });
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

  async sendMessage(channelId: bigint, senderId: bigint, content: string, isEncrypted = false) {
    return this.prisma.channelMessage.create({
      data: {
        channelId,
        senderId,
        content,
        isEncrypted,
      },
    });
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
}
