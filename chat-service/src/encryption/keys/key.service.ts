import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class KeyService {
  constructor(private prisma: PrismaService) {}

  async savePublicKey(userId: string, publicKey: string) {
    const userKey = await this.prisma.userKey.upsert({
      where: { userId: BigInt(userId) },
      update: { publicKey },
      create: {
        userId: BigInt(userId),
        publicKey,
      },
    });

    return {
      message: 'Public key saved successfully',
      userId: userKey.userId.toString(),
      publicKey: userKey.publicKey,
    };
  }

  async getPublicKey(userId: string) {
    const userKey = await this.prisma.userKey.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!userKey) {
      throw new NotFoundException(`Public key for the user not found`);
    }

    return {
      userId: userKey.userId.toString(),
      publicKey: userKey.publicKey,
    };
  }

  async getUserPublicKey(userId: bigint): Promise<string | null> {
    const userKey = await this.prisma.userKey.findUnique({
      where: { userId },
    });

    return userKey?.publicKey || null;
  }

  async getMultiplePublicKeys(userIds: string[]) {
    const keys = await this.prisma.userKey.findMany({
      where: {
        userId: {
          in: userIds.map((id) => BigInt(id)),
        },
      },
    });
    return keys.map((key) => ({
      userId: key.userId.toString(),
      publicKey: key.publicKey,
    }));
  }

  async hasPublicKey(userId: string): Promise<boolean> {
    const userKey = await this.prisma.userKey.findUnique({
      where: { userId: BigInt(userId) },
    });
    return !!userKey;
  }
}
