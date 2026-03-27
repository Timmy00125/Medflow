import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async dispense(prescriptionId: string, pharmacistId: string) {
    // Utilize Prisma interactive transaction for robust ACID guarantees!
    return await this.prisma.client.$transaction(async (tx) => {
      const rx = await tx.prescription.findUnique({
        where: { id: prescriptionId },
      });
      if (!rx || rx.status !== 'PENDING') {
        throw new BadRequestException('Prescription not found or already dispensed');
      }

      // Verify Stock limits safely
      const inventory = await tx.inventory.findUnique({
        where: { drugName: rx.drugName },
      });
      if (!inventory || inventory.stock <= 0) {
        throw new BadRequestException(`Insufficient stock for ${rx.drugName}`);
      }

      // Safely decrement atomic inventory
      await tx.inventory.update({
        where: { drugName: rx.drugName },
        data: { stock: { decrement: 1 } },
      });

      // Update the explicit prescription details
      const updatedRx = await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: 'DISPENSED',
          pharmacistId,
          dispensedAt: new Date(),
        },
      });

      // Transition the state machine!
      await this.queueService.advanceState(rx.patientId, 'DISCHARGED');

      return updatedRx;
    });
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
