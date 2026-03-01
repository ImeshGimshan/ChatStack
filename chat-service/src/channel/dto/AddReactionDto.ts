import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddReactionDto {
  @ApiProperty({ description: 'The emoji to react with' })
  @IsString()
  emoji: string;
}
