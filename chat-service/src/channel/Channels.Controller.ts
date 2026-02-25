import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/Jwt.Auth.guard';
import { ChannelsService } from './Channels.Service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Channels')
@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Get()
  async getChannelsForServer(@Query('serverId') serverId: string) {
    return this.channelsService.getChannelsForServer(BigInt(serverId));
  }

  @Post()
  async createChannel(
    @Body('serverId') serverId: string,
    @Body('name') name: string,
    @Body('description') description: string,
  ) {
    return this.channelsService.createChannel(BigInt(serverId), name, description);
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
  async addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId') userId: string,
  ) {
    return this.channelsService.addMember(BigInt(id), BigInt(userId));
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
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body('senderId') senderId: string,
    @Body('content') content: string,
    @Body('isEncrypted') isEncrypted?: boolean,
  ) {
    return this.channelsService.sendMessage(
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
    return this.channelsService.getMessages(BigInt(id), limit ? parseInt(limit) : 50);
  }

  @Patch(':channelId/messages/:messageId')
  async editMessage(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body('editorId') editorId: string,
    @Body('newContent') newContent: string,
  ) {
    return this.channelsService.editMessage(
      BigInt(messageId),
      BigInt(editorId),
      newContent,
    );
  }

  @Delete(':channelId/messages/:messageId')
  async deleteMessage(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body('requesterId') requesterId: string,
  ) {
    return this.channelsService.deleteMessage(
      BigInt(messageId),
      BigInt(requesterId),
    );
  }

  @Post(':channelId/messages/:messageId/reactions')
  async addReaction(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body('userId') userId: string,
    @Body('emoji') emoji: string,
  ) {
    return this.channelsService.addReaction(
      BigInt(messageId),
      BigInt(userId),
      emoji,
    );
  }

  @Delete(':channelId/messages/:messageId/reactions')
  async removeReaction(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body('userId') userId: string,
    @Body('emoji') emoji: string,
  ) {
    return this.channelsService.removeReaction(
      BigInt(messageId),
      BigInt(userId),
      emoji,
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
