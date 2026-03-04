import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/Jwt.Auth.guard';
import { KeyService } from './key.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class KeysController {
  constructor(private keysService: KeyService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async uploadPublicKey(@Request() req, @Body('publicKey') publicKey: string) {
    const userId = req.user.userId;
    return this.keysService.savePublicKey(userId, publicKey);
  }

  @Get(':userId')
  async getPublicKey(@Param('userId') userId: string) {
    return this.keysService.getPublicKey(userId);
  }

  @Get()
  async getMyPublicKey(@Request() req) {
    const userId = req.user.userId;
    return this.keysService.getPublicKey(userId);
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  async getMultiplePublicKeys(@Body('userIds') userIds: string[]) {
    return this.keysService.getMultiplePublicKeys(userIds);
  }
}