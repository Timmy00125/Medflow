import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VitalsService {
  constructor(private readonly prisma: PrismaService) {}

  async createVitals(
    patientId: string,
    nurseId: string,
    data: {
      temperature?: number;
      bloodPressure?: string;
      heartRate?: number;
      weight?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      notes?: string;
    },
  ) {
    const patientFlow = await this.prisma.patientFlow.findUnique({
      where: { patientId },
    });

    if (!patientFlow) {
      throw new NotFoundException('Patient flow not found');
    }

    const vitals = await this.prisma.vitals.create({
      data: {
        patientId,
        nurseId,
        temperature: data.temperature,
        bloodPressure: data.bloodPressure,
        heartRate: data.heartRate,
        weight: data.weight,
        respiratoryRate: data.respiratoryRate,
        oxygenSaturation: data.oxygenSaturation,
        notes: data.notes,
      },
    });

    // We don't advance the state here, we'll let the controller or front-end handle it
    // if needed. Usually, assigning a doctor advances the state.

    return vitals;
  }

  async getPatientVitals(patientId: string) {
    return this.prisma.vitals.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        nurse: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }
}
