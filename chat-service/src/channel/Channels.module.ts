import { Module } from '@nestjs/common';
import { ChannelsController } from './Channels.Controller';
import { ChannelsService } from './Channels.Service';
import { EncryptionModule } from 'src/encryption/encryption.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [EncryptionModule],
  controllers: [ChannelsController],
  providers: [ChannelsService, PrismaService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
