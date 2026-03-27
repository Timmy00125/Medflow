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
    const test = await this.prisma.client.labTest.findUnique({ where: { id: testId } });
    if (!test) throw new NotFoundException('Lab test not found');

    const updatedTest = await this.prisma.client.labTest.update({
      where: { id: testId },
      data: {
        status: 'COMPLETED',
        resultData, // Encrypted transparently by Prisma Extended Client
        labTechId,
      },
    });

    // Automatically push the patient flow back to the doctor for review
    await this.queueService.advanceState(updatedTest.patientId, 'AWAITING_DOCTOR_REVIEW');

    return updatedTest;
  }
}
