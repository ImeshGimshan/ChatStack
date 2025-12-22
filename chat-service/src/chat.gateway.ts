import { Logger, UseGuards } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { WsAuthGuard } from "./auth/WsAuth.guard";

@WebSocketGateway(3001, {
    cors: {
        origin: '*',
    },
})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private logger: Logger = new Logger('ChatGateway');

    //new connection
    handleConnection(clent: Socket, ...args:any[]){
        this.logger.log(`Client connected: ${clent.id}`);
    }

    //disconnect
    handleDisconnect(client: Socket){
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    //message event
    @UseGuards(WsAuthGuard)
    @SubscribeMessage('message')
    handleMessage(client: Socket, payload: any) : void {
        this.logger.log(`Message received from ${client.id}: ${payload.text}`);

        this.server.emit('message', {
            senderId: client.id,
            message: payload.text,
            timestamp: new Date().toISOString(),
        })
    }
}