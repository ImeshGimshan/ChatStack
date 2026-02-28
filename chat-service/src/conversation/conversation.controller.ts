import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/Jwt.Auth.guard';
import { ConversationService } from './conversation.service';
import e from 'express';

@ApiTags('Conversation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversation')
export class ConversationController {
    constructor(private conversationService: ConversationService) {}

    @Post()
    async createConversation(
        @Body('userIds') userIds: string[],
        @Body('name') name?: string,
    ) {
        return this.conversationService.createConversation(
            userIds.map(BigInt),
            name
        );
    }

    @Get()
    async getConversationsForUser(@Query('userId') userId: string) {
        return this.conversationService.getConversationsForUser(BigInt(userId));
    }

    @Post(':id/messages')
    async sendMessage(
        @Param('id', ParseIntPipe) id: number,
        @Body('senderId') senderId: string,
        @Body('content') content: string,
        @Body('isEncrypted') isEncrypted?: boolean,
    ) {
        return this.conversationService.sendMessage(
            BigInt(id),
            BigInt(senderId),
            content,
            isEncrypted ?? false,
        );
    }

    @Get(':id/messages')
    async getMessages(
        @Param('id', ParseIntPipe) id: number,
        @Query('limit') limit?: string,
    ) {
        return this.conversationService.getMessages(
            BigInt(id),
            limit ? parseInt(limit) : 50,
        )
    }

    @Patch(':conversationId/messages/:messageId')
    async editMessage(
        @Param('conversationId', ParseIntPipe) conversationId: number,
        @Param('messageId', ParseIntPipe) messageId: number,
        @Body('editorId') editorId: string,
        @Body('newContent') newContent: string,
    ) {
        return this.conversationService.editMessage(
            BigInt(messageId),
            BigInt(editorId),
            newContent,
        )
    }

    @Delete(':conversationId/messages/:messageId')
    async deleteMessage(
        @Param('conversationId', ParseIntPipe) conversationId: number,
        @Param('messageId', ParseIntPipe) messageId: number,
        @Body('requesterId') requesterId: string,
    ) {
        return this.conversationService.deleteMessage(
            BigInt(messageId),
            BigInt(requesterId),
        )
    }
}
