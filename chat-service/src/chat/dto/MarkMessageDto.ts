import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class MarkMessageDto {
    @ApiProperty({
        description: 'Whether to mark the message as read or unread',
        example: 1,
    })
    @IsString()
    messageId!: string;

    @ApiProperty({
        description: 'type of room (channel or conversation)',
        enum: ['channel', 'conversation'],
        example: 'channel',
    })
    @IsString()
    roomType!: 'channel' | 'conversation';
}