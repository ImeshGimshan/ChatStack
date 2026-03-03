import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  IsNumberString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'The ID of the server' })
  @IsNumberString()
  @IsNotEmpty()
  serverId: string;

  @ApiProperty({ description: 'The content of the post' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiProperty({ description: 'The ID of an attached image', required: false })
  @IsString()
  @IsOptional()
  imageId?: string;

  @ApiProperty({ description: 'The title of the post', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;
}
