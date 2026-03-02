import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

export class CreateConversationDto {
    @ApiProperty({
        description: 'Array of user IDs to include in the conversation',
        example: ['1', '2', '3']
    })
    @IsArray()
    userIds!: string[];

    @ApiProperty({
        description: 'Optional name for the conversation',
        example: 'Project Discussion',
        required: false
    })
    @IsOptional()
    @IsString()
    name?: string;;
}