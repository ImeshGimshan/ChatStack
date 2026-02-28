import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConversationService {
    constructor(private prisma: PrismaService) {}
    
    async createConversation(userIds: bigint[], name?: string) {
        return this.prisma.conversation.create({
            data: {
                name,
                isGroup: userIds.length > 2,
                members: {
                    create: userIds.map(userIds => ({
                        userId: userIds,
                    })),
                },
            },
            include: {
                members: true
            },
        });
    }

    async getConversationsForUser(userId: bigint) {
        return this.prisma.conversation.findMany({
            where: {
                members: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                members: true,
            },
        });
    }

    async sendMessage(conversationId: bigint, senderId: bigint, content: string, isEncrypted = false) {
        return this.prisma.conversationMessage.create({
            data: {
                conversationId,
                senderId,
                content,
                isEncrypted,
            },
        });
    }

    async getMessages(conversationId: bigint, limit = 50){
        return this.prisma.conversationMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async editMessage(messageId: bigint, editorId: bigint, newContent: string) {
        return this.prisma.conversationMessage.update({
            where: { id: messageId },
            data: {
                 content: newContent,
                 isEdited: true,
                 updatedAt: new Date(),
            },
        });
    }

    async deleteMessage(messageId: bigint, requesterId: bigint) {
        return this.prisma.conversationMessage.update({
            where: { id: messageId },
            data: {
                content: '[deleted]',
                isDeleted: true,
                updatedAt: new Date(),
            },
        });
    }
}
