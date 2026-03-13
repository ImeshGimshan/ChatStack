import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServerService {
  constructor(private prisma: PrismaService) {}

  async createServer(ownerId: bigint, name: string, description?: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Ensure the User exists in our DB to prevent foreign key constraint violations
        await tx.user.upsert({
          where: { id: ownerId },
          update: {},
          create: { id: ownerId },
        });

        // First, create the server
        const server = await tx.server.create({
          data: {
            name,
            description,
            createdBy: ownerId,
          },
        });

        // Then, create the owner role
        const ownerRole = await tx.role.create({
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
        await tx.serverMember.create({
          data: {
            serverId: server.id,
            userId: ownerId,
            nickname: null,
            isBanned: false,
            roleId: ownerRole.id,
          },
        });

        // Return the server with related entities
        return await tx.server.findUnique({
          where: { id: server.id },
          include: {
            members: true,
            channels: true,
            roles: true,
          },
        });
      });
    } catch (error: any) {
      console.error('CreateServer error:', error);
      if (error?.code === 'P2002') {
        throw new ConflictException(`Server with name '${name}' already exists.`);
      }
      throw new InternalServerErrorException('Failed to create server');
    }
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
    // Ensure user exists before adding as a member
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    return this.prisma.serverMember.create({
      data: {
        serverId,
        userId,
        roleId,
        nickname,
      },
    });
  }

  async joinServer(serverId: bigint, userId: bigint) {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    return this.prisma.serverMember.upsert({
      where: {
        serverId_userId: {
          serverId,
          userId,
        },
      },
      update: {},
      create: {
        serverId,
        userId,
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
  async getServersByOwner(ownerId: bigint) {
    return this.prisma.server.findMany({
      where: { createdBy: ownerId },
      include: {
        channels: true,
      },
    });
  }

  async getServersByMember(userId: bigint) {
    const memberships = await this.prisma.serverMember.findMany({
      where: { userId },
      include: {
        server: {
          include: { channels: true },
        },
      },
    });
    return memberships.map((m) => m.server);
  }
}
