import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServerDto {
  @ApiProperty({ description: 'The name of the server' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'The description of the server', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}