import { Module } from '@nestjs/common';
import { KeysController } from './keys.controller';
import { KeyService } from './key.service';

@Module({
  controllers: [KeysController],
  providers: [KeyService],
  exports: [KeyService],
})
export class KeysModule {}
