
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ServerService } from './server.service';
import { CreateServerDto } from './dto/CreateServerDto';
import { JwtAuthGuard } from 'src/auth/Jwt.Auth.guard';


@ApiTags('Server')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('server')
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  @Post()
  @ApiBody({ type: CreateServerDto })
  async createServer(@Body() body: CreateServerDto, @Req() req: any) {
    // Extract userId from JWT payload (assumes JwtStrategy sets req.user)
    const userId = req.user?.userId;
    console.log('req.user:', req.user);
    const { name, description } = body;
    if (!userId || !name) {
      throw new Error('Authenticated userId and name are required');
    }
    return this.serverService.createServer(BigInt(userId), name, description);
  }

  @Get(':id')
  async getServerById(@Param('id', ParseIntPipe) id: number) {
    return this.serverService.getServerById(BigInt(id));
  }

  @Get(':id/channels')
  async getChannels(@Param('id', ParseIntPipe) id: number) {
    return this.serverService.getChannels(BigInt(id));
  }

  @Get(':id/members')
  async getMembers(@Param('id', ParseIntPipe) id: number) {
    return this.serverService.getMembers(BigInt(id));
  }
}
