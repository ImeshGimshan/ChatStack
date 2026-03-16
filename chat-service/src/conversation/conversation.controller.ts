import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/Jwt.Auth.guard';
import { ConversationService } from './conversation.service';
import e from 'express';
import { CreateConversationDto } from './dto/CreateConversationDto';
import { SendConversationMessageDto } from './dto/SendMessageDto';
import { EditConversationMessageDto } from './dto/EditMessageDto';

@ApiTags('Conversation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversation')
export class ConversationController {
  constructor(private conversationService: ConversationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation DM or group' })
  async createConversation(
    @Body() dto: CreateConversationDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Authenticated userId is required');
    }
    try {
      const userIds = [BigInt(userId), ...dto.userIds.map((id) => BigInt(id))];
      return await this.conversationService.createConversation(
        userIds,
        dto.name,
      );
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new InternalServerErrorException('Failed to create conversation');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all conversations for the authenticated user' })
  async getConversationsForUser(@Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Authenticated userId is required');
    }
    try {
      return await this.conversationService.getConversationsForUser(
        BigInt(userId),
      );
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw new InternalServerErrorException('Failed to fetch conversations');
    }
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendConversationMessageDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Authenticated userId is required');
    }
    return this.conversationService.sendMessage(
      BigInt(id),
      BigInt(userId),
      dto.content,
      dto.isEncrypted ?? false,
    );
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages from a conversation' })
  async getMessages(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
  ) {
    try {
      return this.conversationService.getMessages(
        BigInt(id),
        limit ? parseInt(limit) : 50,
      );
    } catch (error: any) {
      console.error('GetMessages error:', error);
      throw new InternalServerErrorException('Failed to fetch messages');
    }
  }

  @Patch(':conversationId/messages/:messageId')
  @ApiOperation({ summary: 'Edit a message in a conversation' })
  async editMessage(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() dto: EditConversationMessageDto,
    @Req() req: any,
  ) {
    const editorId = req.user?.userId;
    if (!editorId) {
        throw new BadRequestException('Authenticated userId is required');
    }
    try {
        return this.conversationService.editMessage(
            BigInt(messageId),
            BigInt(editorId),
            dto.newContent,
        )
    } catch (error: any) {
        console.error('EditMessage error:', error);
        throw new InternalServerErrorException('Failed to edit message');
    }
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
    );
  }

  @Post(':conversationId/messages/:messageId/reactions')
  @ApiOperation({ summary: 'Add a reaction to a conversation message' })
  async addReaction(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body('emoji') emoji: string,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Authenticated userId is required');
    }
    return this.conversationService.addReaction(
      BigInt(messageId),
      BigInt(userId),
      emoji,
    );
  }

  @Delete(':conversationId/messages/:messageId/reactions')
  @ApiOperation({ summary: 'Remove a reaction from a conversation message' })
  async removeReaction(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body('emoji') emoji: string,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Authenticated userId is required');
    }
    return this.conversationService.removeReaction(
      BigInt(messageId),
      BigInt(userId),
      emoji,
    );
  }

  @Get(':conversationId/messages/:messageId/reactions')
  @ApiOperation({ summary: 'Get reactions for a conversation message' })
  async getReactions(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.conversationService.listReactions(BigInt(messageId));
  }
}
