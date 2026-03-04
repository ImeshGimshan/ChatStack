import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { KeyService } from './keys/key.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { KeysController } from './keys/keys.controller';

@Module({
    providers: [EncryptionService, KeyService, PrismaService],
    controllers: [KeysController],
    exports: [EncryptionService, KeyService],
})
export class EncryptionModule {}
