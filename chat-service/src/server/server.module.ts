import { Module } from "@nestjs/common";
import { ServerService } from "./server.service";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
    providers: [ServerService, PrismaService],
    exports: [ServerService],
})
export class ServerModule {}