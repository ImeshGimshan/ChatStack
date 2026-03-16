import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConnectionService {
  constructor(private prisma: PrismaService) {}

  async sendRequest(
    requesterId: number,
    addresseeId: number,
    message?: string,
  ) {
    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot connect with yourself');
    }

    const existing = await this.prisma.connection.findFirst({
      where: {
        OR: [
          {
            requesterId,
            addresseeId,
          },
          {
            requesterId: addresseeId,
            addresseeId: requesterId,
          },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED')
        throw new BadRequestException('Already connected');
      if (existing.status === 'PENDING')
        throw new BadRequestException('Connection request already sent');
      if (existing.status === 'BLOCKED')
        throw new ForbiddenException('You are blocked by this user');
    }

    return this.prisma.connection.create({
      data: {
        requesterId,
        addresseeId,
        message,
      },
    });
  }

  async acceptRequest(currentUserId: number, targetUserId: number) {
    const conn = await this.prisma.connection.findFirst({
      where: {
        requesterId: targetUserId,
        addresseeId: currentUserId,
        status: ConnectionStatus.PENDING,
      },
    });
    if (!conn) throw new NotFoundException('Pending request not found');
    return this.prisma.connection.update({
      where: { id: conn.id },
      data: { status: ConnectionStatus.ACCEPTED },
    });
  }

  async rejectRequest(currentUserId: number, targetUserId: number) {
    const conn = await this.prisma.connection.findFirst({
      where: {
        requesterId: targetUserId,
        addresseeId: currentUserId,
        status: ConnectionStatus.PENDING,
      },
    });
    if (!conn) throw new NotFoundException('Pending request not found');
    return this.prisma.connection.update({
      where: { id: conn.id },
      data: { status: ConnectionStatus.REJECTED },
    });
  }

  async withdrawRequest(currentUserId: number, targetUserId: number) {
    const conn = await this.prisma.connection.findFirst({
      where: {
        requesterId: currentUserId,
        addresseeId: targetUserId,
        status: ConnectionStatus.PENDING,
      },
    });
    if (!conn) throw new NotFoundException('Pending request not found');
    return this.prisma.connection.update({
      where: { id: conn.id },
      data: { status: ConnectionStatus.WITHDRAWN },
    });
  }

  async blockUser(currentUserId: number, targetUserId: number) {
    const existing = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: currentUserId },
        ],
      },
    });
    if (existing) {
      return this.prisma.connection.update({
        where: { id: existing.id },
        data: {
          requesterId: currentUserId,
          addresseeId: targetUserId,
          status: ConnectionStatus.BLOCKED,
        },
      });
    }
    return this.prisma.connection.create({
      data: {
        requesterId: currentUserId,
        addresseeId: targetUserId,
        status: ConnectionStatus.BLOCKED,
      },
    });
  }

  async getMyConnections(userId: number) {
    return this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });
  }

  async getPendingRequests(userId: number) {
    return this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.PENDING,
        addresseeId: userId,
      },
    });
  }

  // Outgoing requests you sent that are still pending
  async getSentRequests(userId: number) {
    return this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.PENDING,
        requesterId: userId,
      },
    });
  }

  // Remove an accepted connection
  async removeConnection(currentUserId: number, targetUserId: number) {
    const conn = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: currentUserId },
        ],
      },
    });
    if (!conn) throw new NotFoundException('Connection not found');
    await this.prisma.connection.delete({ where: { id: conn.id } });
    return { message: 'Connection removed' };
  }

  // Unblock a user
  async unblockUser(currentUserId: number, targetUserId: number) {
    const conn = await this.prisma.connection.findFirst({
      where: {
        requesterId: currentUserId,
        addresseeId: targetUserId,
        status: ConnectionStatus.BLOCKED,
      },
    });
    if (!conn) throw new NotFoundException('No block found for this user');
    await this.prisma.connection.delete({ where: { id: conn.id } });
    return { message: 'User unblocked' };
  }

  // Total accepted connection count for a user (for profile cards)
  async getConnectionCount(userId: number) {
    const count = await this.prisma.connection.count({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });
    return { userId, connectionCount: count };
  }

  // Mutual connections between current user and a target user
  async getMutualConnections(currentUserId: number, targetUserId: number) {
    const [myConns, theirConns] = await Promise.all([
      this.prisma.connection.findMany({
        where: {
          status: ConnectionStatus.ACCEPTED,
          OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
        },
        select: { requesterId: true, addresseeId: true },
      }),
      this.prisma.connection.findMany({
        where: {
          status: ConnectionStatus.ACCEPTED,
          OR: [{ requesterId: targetUserId }, { addresseeId: targetUserId }],
        },
        select: { requesterId: true, addresseeId: true },
      }),
    ]);

    const myNetworkIds = new Set(
      myConns.map((c) =>
        c.requesterId === currentUserId ? c.addresseeId : c.requesterId,
      ),
    );
    const theirNetworkIds = theirConns.map((c) =>
      c.requesterId === targetUserId ? c.addresseeId : c.requesterId,
    );

    const mutualIds = theirNetworkIds.filter(
      (id) => id !== currentUserId && myNetworkIds.has(id),
    );
    return { mutualConnections: mutualIds, count: mutualIds.length };
  }

  // View another user's accepted connections publicly
  async getUserConnections(targetUserId: number) {
    return this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [{ requesterId: targetUserId }, { addresseeId: targetUserId }],
      },
    });
  }

  async getStatus(currentUserId: number, targetUserId: number) {
    const conn = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: currentUserId },
        ],
      },
    });
    if (!conn) return { status: 'NONE' };
    if (conn.status === ConnectionStatus.ACCEPTED) return { status: 'CONNECTED' };
    if (conn.status === ConnectionStatus.PENDING) {
      return { status: conn.requesterId === currentUserId ? 'OUTGOING_PENDING' : 'INCOMING_PENDING' };
    }
    return { status: conn.status };
  }

  // People You May Know — users connected to my connections but not yet connected to me
  async getSuggestions(userId: number) {
    // Get all my accepted connection partner IDs
    const myConnections = await this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: { requesterId: true, addresseeId: true },
    });

    const myNetworkIds = myConnections.map((c) =>
      c.requesterId === userId ? c.addresseeId : c.requesterId,
    );

    if (myNetworkIds.length === 0) return [];

    // Get connections of my connections
    const secondDegree = await this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [
          { requesterId: { in: myNetworkIds } },
          { addresseeId: { in: myNetworkIds } },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    });

    // Collect candidate IDs — exclude myself and already-connected users
    const excludeIds = new Set([userId, ...myNetworkIds]);
    const candidateIds = new Set<number>();
    for (const c of secondDegree) {
      if (!excludeIds.has(c.requesterId)) candidateIds.add(c.requesterId);
      if (!excludeIds.has(c.addresseeId)) candidateIds.add(c.addresseeId);
    }

    // Return suggestion list with mutual count
    const suggestions = Array.from(candidateIds).map((id) => ({
      userId: id,
      mutualConnections: secondDegree.filter(
        (c) => c.requesterId === id || c.addresseeId === id,
      ).length,
    }));

    return suggestions.sort((a, b) => b.mutualConnections - a.mutualConnections);
  }

  private async findPendingForAddressee(
    currentUserId: number,
    connectionId: number,
  ) {
    const conn = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });
    if (!conn) throw new NotFoundException('Connection not found');
    if (conn.addresseeId !== currentUserId)
      throw new ForbiddenException('Not your request to action');
    if (conn.status !== 'PENDING')
      throw new BadRequestException('Request is not pending');
    return conn;
  }
}
