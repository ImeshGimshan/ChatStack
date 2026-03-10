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

  async acceptRequest(currentUserId: number, connectionId: number) {
    const conn = await this.findPendingForAddressee(
      currentUserId,
      connectionId,
    );
    return this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: ConnectionStatus.ACCEPTED },
    });
  }

  async rejectRequest(currentUserId: number, connectionId: number) {
    await this.findPendingForAddressee(currentUserId, connectionId);
    return this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: ConnectionStatus.REJECTED },
    });
  }

  async withdrawRequest(currentUserId: number, connectionId: number) {
    const conn = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });
    if (!conn || conn.requesterId !== currentUserId)
      throw new ForbiddenException('Not your request');
    if (conn.status !== 'PENDING')
      throw new BadRequestException('Can only withdraw pending requests');
    return this.prisma.connection.update({
      where: { id: connectionId },
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

  async getStatus(currentUserId: number, targetUserId: number) {
    const conn = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: currentUserId },
        ],
      },
    });
    return { status: conn?.status ?? 'NONE' };
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
