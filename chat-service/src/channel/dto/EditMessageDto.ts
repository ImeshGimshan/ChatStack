import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditChannelMessageDto {
  @ApiProperty({ description: 'The new content of the message' })
  @IsString()
  newContent: string;
}
