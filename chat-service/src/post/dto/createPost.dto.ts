import { IsNotEmpty, IsOptional, IsString, Max, MaxLength } from "class-validator";

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    content: string;

    @IsString()
    @IsOptional()
    imageId?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    title?: string;
}