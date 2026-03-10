import { Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConnectionController } from './connection.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConnectionModule],
  providers: [ConnectionService],
  controllers: [ConnectionController]
})
export class ConnectionModule {}
