import { Module, Global } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueGateway } from './queue.gateway';

@Global()
@Module({
  providers: [QueueService, QueueGateway],
  controllers: [QueueController],
  exports: [QueueService], // Exported for use in Consultation, Lab, Pharmacy
})
export class QueueModule {}
