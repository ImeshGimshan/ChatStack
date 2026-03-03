import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/Jwt.Auth.guard';
import { ChannelsService } from './Channels.Service';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CreateChannelDto } from './dto/CreateChannelDto';
import { UpdateChannelDto } from './dto/UpdateChannelDto';
import { AddMemberDto } from './dto/AddMemberDto';
import { SendChannelMessageDto } from './dto/SendMessageDto';
import { EditChannelMessageDto } from './dto/EditMessageDto';
import { AddReactionDto } from './dto/AddReactionDto';

@ApiTags('Channels')
@ApiBearerAuth()
@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Get()
  async getChannelsForServer(@Query('serverId') serverId: string) {
    return this.channelsService.getChannelsForServer(BigInt(serverId));
  }

  @Post()
  @ApiBody({ type: CreateChannelDto })
  async createChannel(
    @Body() body: CreateChannelDto,
    @Query('serverId') serverId: string,
  ) {
    if (!serverId) {
      throw new Error('serverId is required');
    }
    return this.channelsService.createChannel(
      BigInt(serverId),
      body.name,
      body.description || '',
    );
  }

  @Get(':id')
  async getChannelById(@Param('id', ParseIntPipe) id: number) {
    return this.channelsService.getChannelById(BigInt(id));
  }

  @Delete(':id')
  async deleteChannel(@Param('id', ParseIntPipe) id: number) {
    return this.channelsService.deleteChannel(BigInt(id));
  }

  @Post(':id/members')
  @ApiBody({ type: AddMemberDto })
  async addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AddMemberDto,
  ) {
    return this.channelsService.addMember(BigInt(id), BigInt(body.userId));
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.channelsService.removeMember(BigInt(id), BigInt(userId));
  }

  @Get(':id/members')
  async listMembers(@Param('id', ParseIntPipe) id: number) {
    return this.channelsService.listMembers(BigInt(id));
  }

  @Post(':id/messages')
  @ApiBody({ type: SendChannelMessageDto })
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SendChannelMessageDto,
    @Req() req: any,
  ) {
    const senderId = req.user?.userId;
    if (!senderId) {
      throw new Error('Authenticated userId is required');
    }
    return this.channelsService.sendMessage(
      BigInt(id),
      BigInt(senderId),
      body.content,
      body.isEncrypted ?? false,
    );
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
  ) {
    return this.channelsService.getMessages(
      BigInt(id),
      limit ? parseInt(limit) : 50,
    );
  }

  @Patch(':channelId/messages/:messageId')
  @ApiBody({ type: EditChannelMessageDto })
  async editMessage(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() body: EditChannelMessageDto,
    @Req() req: any,
  ) {
    const editorId = req.user?.userId;
    if (!editorId) {
      throw new Error('Authenticated userId is required');
    }
    return this.channelsService.editMessage(
      BigInt(messageId),
      BigInt(editorId),
      body.newContent,
    );
  }

  @Delete(':channelId/messages/:messageId')
  async deleteMessage(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Req() req: any,
  ) {
    const requesterId = req.user?.userId;
    if (!requesterId) {
      throw new Error('Authenticated userId is required');
    }
    return this.channelsService.deleteMessage(
      BigInt(messageId),
      BigInt(requesterId),
    );
  }

  @Post(':channelId/messages/:messageId/reactions')
  @ApiBody({ type: AddReactionDto })
  async addReaction(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() body: AddReactionDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('Authenticated userId is required');
    }
    return this.channelsService.addReaction(
      BigInt(messageId),
      BigInt(userId),
      body.emoji,
    );
  }

  @Delete(':channelId/messages/:messageId/reactions')
  @ApiBody({ type: AddReactionDto })
  async removeReaction(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() body: AddReactionDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('Authenticated userId is required');
    }
    return this.channelsService.removeReaction(
      BigInt(messageId),
      BigInt(userId),
      body.emoji,
    );
  }

  @Get(':channelId/messages/:messageId/reactions')
  async listReactions(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.channelsService.listReactions(BigInt(messageId));
  }
}
