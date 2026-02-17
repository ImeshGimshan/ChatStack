import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateChannelDto } from './dto/CreateChannelDto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateChannelDto } from './dto/UpdateChannelDto';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  private formatChannel(channel: any) {
    return {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      isPrivate: channel.isPrivate,
      createdBy: channel.createdBy.toString(),
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }

  private async checkPermission(channelId: number, userId: string, allowedRoles: string[]) {
    const member = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: BigInt(userId)
        }
      }
    });

    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  private async checkMembership(channelId: number, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          where: { userId: BigInt(userId) }
        }
      }
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.isPrivate && channel.members.length === 0) {
      throw new ForbiddenException('You do not have access to this channel');
    }
  }

  async createChannel(userId: string, dto: CreateChannelDto) {
    const existingChannel = await this.prisma.channel.findUnique({
      where: {
        name: dto.name,
      },
    });

    if (existingChannel) {
      throw new BadRequestException('Channel name already exists');
    }

    const channel = await this.prisma.channel.create({
      data: {
        name: dto.name,
        description: dto.description,
        isPrivate: dto.isPrivate || false,
        createdBy: BigInt(userId),
      },
    });

    await this.prisma.channelMember.create({
      data: {
        channelId: channel.id,
        userId: BigInt(userId),
        role: 'owner',
      },
    });

    return this.formatChannel(channel);
  }

  async getChannels(userId: string) {
    const channels = await this.prisma.channel.findMany({
        where: {
            OR: [
                { isPrivate: false },
                {
                    members: {
                        some: { userId: BigInt(userId)}
                    }
                }
            ]
        },
        include: {
            members: {
                select: {
                    userId: true,
                    role: true
                }
            },
            _count: {
                select: {
                    members: true,
                    messages: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return channels.map(channel => ({
        ...this.formatChannel(channel),
        memberCount: channel._count.members,
        messageCount: channel._count.messages,
        isMember: channel.members.some(m => m.userId === BigInt(userId)),
        userRole: channel.members.find(m => m.userId === BigInt(userId))?.role
    }));
  }

  async getChannel(channelId: number, userId: string) {
    const channel = await this.prisma.channel.findUnique({
        where: {
            id: channelId
        },
        include: {
            members: {
                select: {
                    userId: true,
                    role: true,
                    joinedAt: true
                }
            }
        }
    });

    if (!channel) {
        throw new NotFoundException('Channel not found');
    }

    const isMember = channel.members.some(m => m.userId === BigInt(userId));
    if (channel.isPrivate && !isMember) {
        throw new ForbiddenException('You do not have access to this channel');
    }

    return {
        ...this.formatChannel(channel),
        members: channel.members.map(m => ({
            userId: m.userId.toString(),
            role: m.role,
            joinedAt: m.joinedAt
        })),
        isMember,
        userRole: channel.members.find(m => m.userId === BigInt(userId))?.role
    };
  }

  async updateChannel(channelId: number, userId: string, dto: UpdateChannelDto) {
    await this.checkPermission(channelId, userId, ['owner', 'admin']);

    const channel = await this.prisma.channel.update({
        where: {
            id: channelId
        },
        data: dto
    });

    return this.formatChannel(channel);
  }

  async deleteChannel(channelId: number, userId: string) {
    await this.checkPermission(channelId, userId, ['owner']);

    await this.prisma.channel.delete({
        where: {
            id: channelId
        }
    });

    return { message: 'Channel deleted successfully' };
  }

  async joinChannel(channelId: number, userId: string) {
    const channel = await this.prisma.channel.findUnique({
        where: {
            id: channelId
        }
    });

    if (!channel) {
        throw new NotFoundException('Channel not found');
    }

    if (channel.isPrivate) {
        throw new ForbiddenException('You cannot join a private channel without an invite');
    }

    const existingMember = await this.prisma.channelMember.findUnique({
        where: {
            channelId_userId: {
                channelId,
                userId: BigInt(userId)
            }
        }
    });

    if (existingMember) {
        throw new BadRequestException('You are already a member of this channel');
    }

    await this.prisma.channelMember.create({
        data: {
            channelId,
            userId: BigInt(userId),
            role: 'member'
        }
    });

    return { message: 'Joined channel successfully' };
  }

  async leaveChannel(channelId: number, userId: string) {
    const member = await this.prisma.channelMember.findUnique({
        where: {
            channelId_userId: {
                channelId,
                userId: BigInt(userId)
            }
        }
    });

    if (!member) {
        throw new BadRequestException('You are not a member of this channel');
    }

    if (member.role === 'owner') {
        throw new BadRequestException('Owners cannot leave their own channel. Please transfer ownership or delete the channel.');
    }

    await this.prisma.channelMember.delete({
        where: {
            channelId_userId: {
                channelId,
                userId: BigInt(userId)
            }
        }
    });

    return { message: 'Left channel successfully' };
  }

  async addMember(channelId: number, userId: string, newUserId: string, role: string) {
    await this.checkPermission(channelId, userId, ['owner', 'admin']);

    const existingMember = await this.prisma.channelMember.findUnique({
        where: {
            channelId_userId: {
                channelId,
                userId: BigInt(newUserId)
            }
        }
    });

    if (existingMember) {
        throw new BadRequestException('User is already a member of this channel');
    }

    await this.prisma.channelMember.create({
        data: {
            channelId,
            userId: BigInt(newUserId),
            role
        }
    });

    return { message: 'Member added successfully' };
  }

  async removeMember(channelId: number, userId: string, removeUserId: string) {
    await this.checkPermission(channelId, userId, ['owner', 'admin']);

    const member = await this.prisma.channelMember.findUnique({
        where: {
            channelId_userId: {
                channelId,
                userId: BigInt(removeUserId)
            }
        }
    });

    if (!member) {
        throw new NotFoundException('User is not a member of this channel');
    }

    if (member.role === 'owner') {
        throw new ForbiddenException('You cannot remove the owner of the channel');
    }

    await this.prisma.channelMember.delete({
        where: {
            channelId_userId: {
                channelId,
                userId: BigInt(removeUserId)
            }
        }
    });

    return { message: 'Member removed successfully' };
  }

  async updateMemberRole(channelId: number, userId: string, targetUserIdl: string, newRole: string) {
    await this.checkPermission(channelId, userId, ['owner']);

    await this.prisma.channelMember.update({
        where: {
            channelId_userId: {
                channelId,
                userId: BigInt(targetUserIdl)
            }
        },
        data: {
            role: newRole
        }
    });

    return { message: 'Member role updated successfully' };
  }

  async getChannelMessages(channelId: number, userId: string, limit: number = 50) {
    await this.checkMembership(channelId, userId);

    const messages = await this.prisma.channelMessage.findMany({
        where: {
            channelId
        },
        orderBy: {
            timestamp: 'desc'
        },
        take: limit,
    });

    return messages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId.toString(),
        text: msg.text,
        isEncrypted: msg.isEncrypted,
        timestamp: msg.timestamp,
    }));
  }

  async saveMessage(channelId: number, userId: string, text: string, isEncrypted: boolean = false) {
    await this.checkMembership(channelId, userId);

    const message = await this.prisma.channelMessage.create({
        data: {
            channelId,
            senderId: BigInt(userId),
            text,
            isEncrypted
        }
    });

    return {
        id: message.id,
        senderId: message.senderId.toString(),
        text: message.text,
        isEncrypted: message.isEncrypted,
        timestamp: message.timestamp,
    };
  }
}
