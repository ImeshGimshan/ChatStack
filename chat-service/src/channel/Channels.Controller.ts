import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/Jwt.Auth.guard';
import { ChannelsService } from './Channels.Service';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}
}
