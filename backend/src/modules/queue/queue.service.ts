import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueGateway } from './queue.gateway';
import { DepartmentState, Prisma } from '@prisma/client';

type PatientFlowTxClient = Pick<PrismaService['client'], 'patientFlow'>;

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueGateway: QueueGateway,
  ) {}

  async getQueueByState(
    states: DepartmentState[],
    where?: Prisma.PatientFlowWhereInput,
  ) {
    return this.prisma.client.patientFlow.findMany({
      where: {
        currentState: { in: states },
        ...(where || {}),
      },
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

  async getAssignableDoctors() {
    return this.prisma.client.user.findMany({
      where: { role: 'DOCTOR' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async advanceState(
    patientId: string,
    newState: DepartmentState,
    meta?: {
      assignedDoctorId?: string;
      assignedLabId?: string;
      assignedPharmId?: string;
    },
  ) {
    const updated = await this.advanceStateInTx(
      this.prisma.client,
      patientId,
      newState,
      meta,
    );
    this.emitQueueStateChanged(patientId);
    return updated;
  }

  async assignPatientToDoctor(patientId: string, doctorId: string) {
    if (!doctorId) {
      throw new BadRequestException('Doctor is required');
    }

    const doctor = await this.prisma.client.user.findFirst({
      where: { id: doctorId, role: 'DOCTOR' },
      select: { id: true },
    });

    if (!doctor) {
      throw new BadRequestException('Selected doctor is invalid');
    }

    return this.advanceState(patientId, 'AWAITING_DOCTOR', {
      assignedDoctorId: doctorId,
    });
  }

  async advanceStateInTx(
    tx: PatientFlowTxClient,
    patientId: string,
    newState: DepartmentState,
    meta?: {
      assignedDoctorId?: string;
      assignedLabId?: string;
      assignedPharmId?: string;
    },
  ) {
    return tx.patientFlow.update({
      where: { patientId },
      data: {
        currentState: newState,
        ...meta,
        queueEnteredAt: new Date(),
      },
    });
  }

  emitQueueStateChanged(patientId: string) {
    this.queueGateway.broadcastQueueUpdate();
    this.queueGateway.broadcastPatientSpecificUpdate(patientId);
  }
}
