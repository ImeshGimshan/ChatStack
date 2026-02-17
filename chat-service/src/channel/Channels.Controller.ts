import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/Jwt.Auth.guard';
import { ChannelsService } from './Channels.Service';
import { CreateChannelDto } from './dto/CreateChannelDto';
import { UpdateChannelDto } from './dto/UpdateChannelDto';
import { AddMemberDto } from './dto/AddMemberDto';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Post()
  createChannel(@Request() req, @Body() dto: CreateChannelDto) {
    return this.channelsService.createChannel(req.user.sub, dto);
  }

  @Get()
  getChannels(@Request() req) {
    return this.channelsService.getChannels(req.user.sub);
  }

  @Get(':id')
  getChannel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.channelsService.getChannel(id, req.user.sub);
  }

  @Put(':id')
  updateChannel(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.channelsService.updateChannel(id, req.user.sub, dto);
  }

  @Delete(':id')
  deleteChannel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.channelsService.deleteChannel(id, req.user.sub);
  }

  @Post(':id/join')
  joinChannel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.channelsService.joinChannel(id, req.user.sub);
  }

  @Post(':id/leave')
  leaveChannel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.channelsService.leaveChannel(id, req.user.sub);
  }

  @Post(':id/members')
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: AddMemberDto,
  ) {
    return this.channelsService.addMember(
      id,
      req.user.sub,
      dto.userId,
      dto.role,
    );
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.channelsService.removeMember(id, req.user.sub, userId);
  }

  @Put(':id/members/:userId/role')
  updateMemberRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId') userId: string,
    @Request() req,
    @Body('role') role: string,
  ) {
    return this.channelsService.updateMemberRole(
      id,
      req.user.sub,
      userId,
      role,
    );
  }

  @Get(':id/messages')
  getChannelMessages(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    return this.channelsService.getChannelMessages(
      id,
      req.user.sub,
      limit ? parseInt(limit) : 50,
    );
  }
}
