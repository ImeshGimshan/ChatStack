import { IsOptional, IsString, Max, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiProperty({ description: 'The new content of the post', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;

  @ApiProperty({ description: 'The ID of a new attached image', required: false })
  @IsString()
  @IsOptional()
  imageId?: string;

  @ApiProperty({ description: 'The new title of the post', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;
}
