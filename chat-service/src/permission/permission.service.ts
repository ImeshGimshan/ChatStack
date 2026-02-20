import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  // Server Permissions

  async isServerMember(userId: bigint, serverId: bigint): Promise<boolean> {
    const member = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId,
          userId,
        },
      },
    });

    return !!member && !member.isBanned;
  }

  async isUserBanned(userId: bigint, serverId: bigint): Promise<boolean> {
    const member = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId,
          userId,
        },
      },
    });

    return !!member?.isBanned;
  }

  async getUserRole(userId: bigint, serverId: bigint) {
    const member = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId,
          userId,
        },
      },
      include: {
        role: true,
      },
    });
    return member?.role || null;
  }

  async hasServerPermission(
    userId: bigint,
    serverId: bigint,
    permission: keyof {
      canManageServer: boolean;
      canManageChannels: boolean;
      canManageRoles: boolean;
      canKickMembers: boolean;
      canBanMembers: boolean;
      canSendMessages: boolean;
      canDeleteMessages: boolean;
      canMentionEveryone: boolean;
    },
  ): Promise<boolean> {
    const isMember = await this.isServerMember(userId, serverId);
    if (!isMember) {
      return false;
    }

    const role = await this.getUserRole(userId, serverId);

    if (!role) {
      return permission === 'canSendMessages';
    }

    return role[permission] === true;
  }

  // Channel Permissions

  async canAccessChannel(userId: bigint, channelId: bigint): Promise<boolean> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        serverId: true,
      },
    });

    if (!channel) {
      return false;
    }

    return this.isServerMember(userId, channel.serverId);
  }

  async canSendMessage(userId: bigint, channelId: bigint): Promise<boolean> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        serverId: true,
      },
    });

    if (!channel) {
      return false;
    }

    return this.hasServerPermission(
      userId,
      channel.serverId,
      'canSendMessages',
    );
  }

  async canManageChannel(userId: bigint, channelId: bigint): Promise<boolean> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        serverId: true,
      },
    });

    if (!channel) {
      return false;
    }

    return this.hasServerPermission(
      userId,
      channel.serverId,
      'canManageChannels',
    );
  }

  // Message Permissions

  async canEditChannelMessage(
    userId: bigint,
    messageId: bigint,
  ): Promise<boolean> {
    const message = await this.prisma.channelMessage.findUnique({
      where: { id: messageId },
      select: {
        senderId: true,
      },
    });

    if (!message) {
      return false;
    }

    return message.senderId === userId;
  }

  async canDeleteChannelMessage(
    userId: bigint,
    messageId: bigint,
  ): Promise<boolean> {
    const message = await this.prisma.channelMessage.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          select: {
            serverId: true,
          },
        },
      },
    });

    if (!message) {
      return false;
    }

    if (message.senderId === userId) {
      return true;
    }

    return this.hasServerPermission(
      userId,
      message.channel.serverId,
      'canDeleteMessages',
    );
  }

  // conversation (DM) Permissions

  async isConversationMember(userId: bigint, conversationId: bigint): Promise<boolean> {
    const member = await this.prisma.conversationMember.findUnique({
        where: {
            conversationId_userId: {
                conversationId,
                userId,
            },
        },
    });
    return !!member;
  }

  async canSendDM(userId: bigint, conversationId: bigint): Promise<boolean> {
    return this.isConversationMember(userId, conversationId);
  }

  async canDeleteDM(userId: bigint, messageId: bigint): Promise<boolean> {
    const message = await this.prisma.conversationMessage.findUnique({
        where: { id: messageId },
        select: {
            senderId: true,
        },
    });

    if (!message) {
        return false;
    }

    return message.senderId === userId;
  }

  // role management permissions

  async canManageRoles(userId: bigint, serverId: bigint): Promise<boolean> {
    return this.hasServerPermission(userId, serverId, 'canManageRoles');
  }

  async canKickMemeber(userId: bigint, serverId: bigint): Promise<boolean> {
    return this.hasServerPermission(userId, serverId, 'canKickMembers');
  }

  async canBanMember(userId: bigint, serverId: bigint): Promise<boolean> {
    return this.hasServerPermission(userId, serverId, 'canBanMembers');
  }

  async canManageServer(userId: bigint, serverId: bigint): Promise<boolean> {
    return this.hasServerPermission(userId, serverId, 'canManageServer');
  }
}
