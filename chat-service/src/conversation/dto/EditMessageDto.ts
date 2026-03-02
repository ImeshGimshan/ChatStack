import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class EditMessageDto {
    @ApiProperty({
        description: 'The new content of the message',
        example: 'updated message content',
    })
    @IsString()
    newContent!: string;
}