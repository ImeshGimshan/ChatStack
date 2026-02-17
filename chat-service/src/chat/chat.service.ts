import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(senderId: string, text: string) {
    return this.prisma.message.create({
      data: {
        senderId: BigInt(senderId),
        text,
        isEncrypted: false,
      },
    });
  }

  async savePrivateMessage(data: {
    senderId: string;
    recipientId: string;
    text: string;
    isEncrypted: boolean;
  }) {
    return this.prisma.message.create({
      data: {
        senderId: BigInt(data.senderId),
        recipientId: BigInt(data.recipientId),
        text: data.text,
        isEncrypted: data.isEncrypted,
      },
    });
  }

  async getPrivateMessages(userId1: string, userId2: string, limit: number = 50) {
    return this.prisma.message.findMany({
        where: {
            OR : [
                {senderId: BigInt(userId1), recipientId: BigInt(userId2) },
                { senderId: BigInt(userId2), recipientId: BigInt(userId1) }
            ],
        },
        orderBy: {
            timestamp: 'asc'
        },
        take: limit,
    });
  }

  async getMessages(limit: number = 100) {
    return this.prisma.message.findMany({
        where: {
            recipientId: null
        },
        orderBy: {
            timestamp: 'asc'
        },
        take: limit,
    });
  }
}
