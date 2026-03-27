import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class LaboratoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async getWorklist() {
    return this.prisma.client.labTest.findMany({
      where: { status: 'PENDING' },
      include: { patient: { select: { id: true, name: true } } },
    });
  }

  async uploadResult(testId: string, labTechId: string, resultData: string) {
    const updatedTest = await this.prisma.client.$transaction(async (tx) => {
      const test = await tx.labTest.findUnique({ where: { id: testId } });
      if (!test) throw new NotFoundException('Lab test not found');

      const completedTest = await tx.labTest.update({
        where: { id: testId },
        data: {
          status: 'COMPLETED',
          resultData,
          labTechId,
        },
      });

      await this.queueService.advanceStateInTx(
        tx,
        completedTest.patientId,
        'AWAITING_DOCTOR_REVIEW',
      );

      return completedTest;
    });
    this.queueService.emitQueueStateChanged(updatedTest.patientId);
    return updatedTest;
  }
}
