import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({ description: 'The new content of the comment', required: false })
  @IsString()
  @IsOptional()
  content?: string;
}
