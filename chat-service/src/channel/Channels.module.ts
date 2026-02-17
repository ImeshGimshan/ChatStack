import { Module } from "@nestjs/common";
import { ChannelsController } from "./Channels.Controller";
import { ChannelsService } from "./Channels.Service";

@Module({
    controllers: [ChannelsController],
    providers: [ChannelsService],
    exports: [ChannelsService]
})
export class ChannelsModule {}