import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'The content of the message' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Whether the message is encrypted', required: false })
  @IsOptional()
  @IsBoolean()
  isEncrypted?: boolean;
}
