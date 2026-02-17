import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/Jwt.Auth.guard";
import { KeyService } from "./key.service";

@Controller("keys")
@UseGuards(JwtAuthGuard)
export class KeysController {
    constructor (private keysService: KeyService) {}

    @Post()
    @HttpCode(HttpStatus.OK)
    async uploadPublicKey(@Request() req, @Body('publicKey') publicKey: string) {
        const userId = req.user.sub;
        return this.keysService.savePublicKey(userId, publicKey);
    }

    @Get(':userId')
    async getPublicKey(@Param('userId') userId: string) {
        return this.keysService.getPublicKey(userId);
    }

    @Get()
    async getMyPublicKey(@Request() req){
        const userId = req.user.sub;
        return this.keysService.getPublicKey(userId);
    }

    @Post('batch')
    @HttpCode(HttpStatus.OK)
    async getMultiplePublicKeys(@Body('userIds') userIds: string[]){
        return this.keysService.getMultiplePublicKeys(userIds);
    }
}