import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SendConversationMessageDto {
  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello, how are you?',
  })
  @IsString()
  content!: string;

  @ApiProperty({
    description: 'Whether the message is encrypted',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isEncrypted?: boolean;
}
