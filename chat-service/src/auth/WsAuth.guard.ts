import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";

@Injectable()
export class WsAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}
    canActivate(context: ExecutionContext): boolean {
        const client = context.switchToWs().getClient();

        // extract token from headers
        const token = client.handshake.headers.authorization?.split(' ')[1];
        if(!token) {
            throw new WsException('Unauthorized');
        }
        try {
            //verify token
            const payload = this.jwtService.verify(token);

            //attach user info to client from springboot
            client.user = payload;
            return true;
        }
        catch (err){
            throw new WsException('Unauthorized: Invalid token');
        }
    }
}