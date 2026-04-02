import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class PharmacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async getWorklist() {
    return this.prisma.client.prescription.findMany({
      where: { status: 'PENDING' },
      include: { patient: { select: { id: true, name: true } } },
    });
  }

  async getAllPrescriptions() {
    return this.prisma.client.prescription.findMany({
      include: { 
        patient: { select: { id: true, name: true } },
        pharmacist: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async dispense(prescriptionId: string, pharmacistId: string) {
    const updatedRx = await this.prisma.client.$transaction(async (tx) => {
      const rx = await tx.prescription.findUnique({
        where: { id: prescriptionId },
      });
      if (!rx || rx.status !== 'PENDING') {
        throw new BadRequestException(
          'Prescription not found or already dispensed',
        );
      }

      const inventory = await tx.inventory.findUnique({
        where: { drugName: rx.drugName },
      });
      if (!inventory || inventory.stock <= 0) {
        throw new BadRequestException(`Insufficient stock for ${rx.drugName}`);
      }

      await tx.inventory.update({
        where: { drugName: rx.drugName },
        data: { stock: { decrement: 1 } },
      });

      const updatedRx = await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: 'DISPENSED',
          pharmacistId,
          dispensedAt: new Date(),
        },
      });

      await this.queueService.advanceStateInTx(
        tx,
        updatedRx.patientId,
        'AWAITING_DOCTOR_REVIEW',
      );

      return updatedRx;
    });
    this.queueService.emitQueueStateChanged(updatedRx.patientId);
    return updatedRx;
  }

  async addInventory(drugName: string, quantity: number) {
    return this.prisma.client.inventory.upsert({
      where: { drugName },
      update: { stock: { increment: quantity } },
      create: { drugName, stock: quantity },
    });
  }

  async getInventory() {
    return this.prisma.client.inventory.findMany();
  }
}
