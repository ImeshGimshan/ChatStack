import { IsString, IsIn, IsOptional } from 'class-validator';

export class AddMemberDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  @IsIn(['member', 'moderator', 'admin'])
  role: string;
}