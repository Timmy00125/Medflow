import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class ConsultationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async createNote(doctorId: string, patientId: string, notes: string) {
    return this.prisma.client.consultationNote.create({
      data: {
        doctorId,
        patientId,
        notes,
      },
    });
  }

  async getPatientNotes(patientId: string) {
    return this.prisma.client.consultationNote.findMany({
      where: { patientId },
      include: { doctor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPatientLabResults(patientId: string) {
    return this.prisma.client.labTest.findMany({
      where: { patientId },
      include: { labTech: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async orderLabTest(doctorId: string, patientId: string, testName: string) {
    const labTest = await this.prisma.client.$transaction(async (tx) => {
      await this.queueService.advanceStateInTx(tx, patientId, 'AWAITING_LAB');
      return tx.labTest.create({
        data: {
          patientId,
          testName,
          status: 'PENDING',
        },
      });
    });
    this.queueService.emitQueueStateChanged(patientId);
    return labTest;
  }

  async prescribeDrug(
    doctorId: string,
    patientId: string,
    drugName: string,
    dosage: string,
  ) {
    const prescription = await this.prisma.client.$transaction(async (tx) => {
      await this.queueService.advanceStateInTx(
        tx,
        patientId,
        'AWAITING_PHARMACY',
      );
      return tx.prescription.create({
        data: {
          patientId,
          drugName,
          dosage,
          status: 'PENDING',
        },
      });
    });
    this.queueService.emitQueueStateChanged(patientId);
    return prescription;
  }
}
