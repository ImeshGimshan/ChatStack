import { IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({ description: 'The ID of the user to add' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'The role of the user (member, moderator, admin)', required: false })
  @IsOptional()
  @IsString()
  @IsIn(['member', 'moderator', 'admin'])
  role: string;
}
