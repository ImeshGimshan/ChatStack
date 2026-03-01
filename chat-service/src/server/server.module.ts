import { Module } from '@nestjs/common';
import { ServerService } from './server.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ServerController } from './server.controller';

@Module({
  providers: [ServerService, PrismaService],
  exports: [ServerService],
  controllers: [ServerController],
})
export class ServerModule {}
