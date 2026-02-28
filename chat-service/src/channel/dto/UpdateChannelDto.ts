import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChannelDto {
  @ApiProperty({ description: 'The new name of the channel', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiProperty({ description: 'The new description of the channel', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
