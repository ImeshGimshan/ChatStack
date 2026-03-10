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
    return await this.service.sendRequest(req.user.id, addresseeId, message);
  }

  @Patch(':id/accept')
  async accept(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return await this.service.acceptRequest(req.user.id, id);
  }

  @Patch(':id/reject')
  async reject(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return await this.service.rejectRequest(req.user.id, id);
  }

  @Delete(':id/withdraw')
  async withdraw(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return await this.service.withdrawRequest(req.user.id, id);
  }

  @Post('block/:targetUserId')
  async block(
    @Req() req: any,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return await this.service.blockUser(req.user.id, targetUserId);
  }

  @Get('me')
  async myConnections(@Req() req: any) {
    return await this.service.getMyConnections(req.user.id);
  }

  @Get('pending')
  async pending(@Req() req: any) {
    return await this.service.getPendingRequests(req.user.id);
  }

  @Get('status/:targetUserId')
  status(
    @Req() req: any,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return this.service.getStatus(req.userId, targetUserId);
  }
}
