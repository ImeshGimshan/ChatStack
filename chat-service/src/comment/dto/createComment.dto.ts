import { IsInt, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'The ID of the post to comment on' })
  @IsInt()
  @IsNotEmpty()
  postId: number;

  @ApiProperty({ description: 'The content of the comment' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
