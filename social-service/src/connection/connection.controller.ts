import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ConnectionService } from './connection.service';

@Controller('connection')
export class ConnectionController {
  constructor(private readonly service: ConnectionService) {}

  @Post('request/:addresseeId')
  async send(
    @Req() req: any,
    @Param('addresseeId', ParseIntPipe) addresseeId: number,
    @Body('message') message?: string,
  ) {
    return await this.service.sendRequest(req.userId, addresseeId, message);
  }

  @Patch(':targetUserId/accept')
  async accept(@Req() req: any, @Param('targetUserId', ParseIntPipe) targetUserId: number) {
    return await this.service.acceptRequest(req.userId, targetUserId);
  }

  @Patch(':targetUserId/reject')
  async reject(@Req() req: any, @Param('targetUserId', ParseIntPipe) targetUserId: number) {
    return await this.service.rejectRequest(req.userId, targetUserId);
  }

  @Delete(':targetUserId/withdraw')
  async withdraw(@Req() req: any, @Param('targetUserId', ParseIntPipe) targetUserId: number) {
    return await this.service.withdrawRequest(req.userId, targetUserId);
  }

  @Post('block/:targetUserId')
  async block(
    @Req() req: any,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return await this.service.blockUser(req.userId, targetUserId);
  }

  @Get('me')
  async myConnections(@Req() req: any) {
    return await this.service.getMyConnections(req.userId);
  }

  @Get('pending')
  async pending(@Req() req: any) {
    return await this.service.getPendingRequests(req.userId);
  }

  @Get('sent')
  async sent(@Req() req: any) {
    return await this.service.getSentRequests(req.userId);
  }

  @Delete(':targetUserId/remove')
  async remove(@Req() req: any, @Param('targetUserId', ParseIntPipe) targetUserId: number) {
    return await this.service.removeConnection(req.userId, targetUserId);
  }

  @Delete('unblock/:targetUserId')
  async unblock(
    @Req() req: any,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return await this.service.unblockUser(req.userId, targetUserId);
  }

  @Get('count/:userId')
  count(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getConnectionCount(userId);
  }

  @Get('mutual/:targetUserId')
  mutual(
    @Req() req: any,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return this.service.getMutualConnections(req.userId, targetUserId);
  }

  @Get('user/:userId')
  userConnections(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getUserConnections(userId);
  }

  @Get('suggestions')
  suggestions(@Req() req: any) {
    return this.service.getSuggestions(req.userId);
  }

  @Get('status/:targetUserId')
  status(
    @Req() req: any,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return this.service.getStatus(req.userId, targetUserId);
  }
}
