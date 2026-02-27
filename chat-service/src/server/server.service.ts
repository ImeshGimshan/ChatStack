import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServerService {
  constructor(private prisma: PrismaService) {}

  async createServer(ownerId: bigint, name: string, description?: string) {
    // First, create the server
    const server = await this.prisma.server.create({
      data: {
        name,
        description,
        createdBy: ownerId,
      },
    });

    // Then, create the owner role
    const ownerRole = await this.prisma.role.create({
      data: {
        name: 'Owner',
        serverId: server.id,
        canManageServer: true,
        canManageChannels: true,
        canManageRoles: true,
        canKickMembers: true,
        canBanMembers: true,
        canSendMessages: true,
        canDeleteMessages: true,
        canMentionEveryone: true,
        color: '#FFD700',
        position: 100,
      },
    });

    // Finally, add the owner as a member with the owner role
    await this.prisma.serverMember.create({
      data: {
        serverId: server.id,
        userId: ownerId,
        nickname: null,
        isBanned: false,
        roleId: ownerRole.id,
      },
    });

    // Return the server with related entities
    return this.prisma.server.findUnique({
      where: { id: server.id },
      include: {
        members: true,
        channels: true,
        roles: true,
      },
    });
  }

  async getServerById(serverId: bigint) {
    return this.prisma.server.findUnique({
      where: { id: serverId },
      include: {
        members: true,
        channels: true,
        roles: true,
      },
    });
  }

  async addMember(
    serverId: bigint,
    userId: bigint,
    roleId?: bigint,
    nickname?: string,
  ) {
    return this.prisma.serverMember.create({
      data: {
        serverId,
        userId,
        roleId,
        nickname,
      },
    });
  }

  async removeMember(serverId: bigint, userId: bigint) {
    return this.prisma.serverMember.delete({
      where: {
        serverId_userId: {
          serverId,
          userId,
        },
      },
    });
  }

  async assignRole(serverId: bigint, userId: bigint, roleId: bigint) {
    return this.prisma.serverMember.update({
      where: {
        serverId_userId: {
          serverId,
          userId,
        },
      },
      data: {
        roleId,
      },
    });
  }

  async getChannels(serverId: bigint) {
    return this.prisma.channel.findMany({
      where: { serverId },
    });
  }

  async getMembers(serverId: bigint) {
    return this.prisma.serverMember.findMany({
      where: { serverId },
      include: {
        user: true,
        role: true,
      },
    });
  }
}
