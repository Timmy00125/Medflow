import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueGateway } from './queue.gateway';
import { DepartmentState } from '@prisma/client';

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueGateway: QueueGateway,
  ) {}

  async getQueueByState(states: DepartmentState[]) {
    return this.prisma.client.patientFlow.findMany({
      where: { currentState: { in: states } },
      include: {
        patient: { select: { id: true, name: true, email: true } },
      },
      orderBy: { queueEnteredAt: 'asc' },
    });
  }

  async getPatientState(patientId: string) {
    const flow = await this.prisma.client.patientFlow.findUnique({
      where: { patientId },
      include: { patient: { select: { name: true, email: true } } },
    });
    if (!flow) throw new NotFoundException('Patient flow not found');
    return flow;
  }

  async advanceState(patientId: string, newState: DepartmentState, meta?: { assignedDoctorId?: string, assignedLabId?: string, assignedPharmId?: string }) {
    const updated = await this.prisma.client.patientFlow.update({
      where: { patientId },
      data: {
        currentState: newState,
        ...meta,
        queueEnteredAt: new Date(),
      },
    });

    this.queueGateway.broadcastQueueUpdate();
    this.queueGateway.broadcastPatientSpecificUpdate(patientId);

    return updated;
  }
}
