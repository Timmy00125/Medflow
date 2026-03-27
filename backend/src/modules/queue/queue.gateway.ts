import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger: Logger = new Logger('QueueGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastQueueUpdate() {
    this.server.emit('queueUpdate', { timestamp: new Date().toISOString() });
    this.logger.log('Broadcasted queue update signal to clients.');
  }

  broadcastPatientSpecificUpdate(patientId: string) {
    this.server.emit(`patientUpdate-${patientId}`, { timestamp: new Date().toISOString() });
  }
}
