import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EditConversationMessageDto {
  @ApiProperty({
    description: 'The new content of the message',
    example: 'updated message content',
  })
  @IsString()
  newContent!: string;
}
