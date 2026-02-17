import { IsOptional, IsString, Max, MaxLength } from "@nestjs/class-validator";

export class UpdatePostDto {
    @IsString()
    @IsOptional()
    @MaxLength(5000)
    content?: string;

    @IsString()
    @IsOptional()
    imageId?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    title?: string;
}