import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/Jwt.Auth.guard';
import { ChatService } from './chat.service';
import { MarkMessageDto } from './dto/MarkMessageDto';

@ApiTags('Read Receipts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('messages/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  async markMessageRead(@Body() dto: MarkMessageDto, @Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Authenticated userId is required');
    }

    try {
      if (dto.roomType === 'channel') {
        return await this.chatService.markChannelMessageRead(
          BigInt(dto.messageId),
          BigInt(userId),
        );
      } else if (dto.roomType === 'conversation') {
        return await this.chatService.markConversationMessageRead(
          BigInt(dto.messageId),
          BigInt(userId),
        );
      } else {
        throw new BadRequestException('Invalid room type');
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw new InternalServerErrorException('Failed to mark message as read');
    }
  }

  @Get('channels/:id/unread-count')
  @ApiOperation({ summary: 'Get unread message count for a channel' })
  async getChannelUnreadCount(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Authenticated userId is required');
    }

    try {
      const unreadCount = await this.chatService.getChannelUnreadCount(
        BigInt(id),
        BigInt(userId),
      );
      return { channelId: id, unreadCount };
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      throw new InternalServerErrorException('Failed to fetch unread count');
    }
  }

  @Get('conversations/:id/unread-count')
  @ApiOperation({ summary: 'Get unread message count for a conversation' })
  async getConversationUnreadCount(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Authenticated userId is required');
    }

    try {
      const unreadCount = await this.chatService.getConversationUnreadCount(
        BigInt(id),
        BigInt(userId),
      );
      return { conversationId: id, unreadCount };
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      throw new InternalServerErrorException('Failed to fetch unread count');
    }
  }

  @Get('channels/:id/messages/:messageId/read-receipts')
  @ApiOperation({ summary: 'Get read receipts for a channel message' })
  async getChannelMessageReadReceipts(
    @Param('id', ParseIntPipe) id: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    try {
      return this.chatService.getChannelMessageReadReceipts(BigInt(messageId));
    } catch (error: any) {
      console.error('Error fetching read receipts:', error);
      throw new InternalServerErrorException('Failed to fetch read receipts');
    }
  }

  @Get('conversations/:id/messages/:messageId/read-receipts')
  @ApiOperation({ summary: 'Get read receipts for a conversation message' })
  async getConversationMessageReadReceipts(
    @Param('id', ParseIntPipe) id: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    try {
      return this.chatService.getConversationMessageReadReceipts(
        BigInt(messageId),
      );
    } catch (error: any) {
      console.error('Error fetching read receipts:', error);
      throw new InternalServerErrorException('Failed to fetch read receipts');
    }
  }

  @Get('unread-messages')
  @ApiOperation({
    summary: 'Get all unread channel messages for the authenticated user',
  })
  async getUnreadMessages(@Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Authenticated userId is required');
    }

    try {
      const unreadChannelMessages =
        await this.chatService.getUserUnreadChannelMessages(BigInt(userId));
      const unreadConversationMessages =
        await this.chatService.getUserUnreadConversationMessages(
          BigInt(userId),
        );

      return {
        channels: unreadChannelMessages,
        conversations: unreadConversationMessages,
      };
    } catch (error: any) {
      console.error('Error fetching unread messages:', error);
      throw new InternalServerErrorException('Failed to fetch unread messages');
    }
  }
}
