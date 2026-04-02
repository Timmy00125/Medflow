import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { JwtAuthGuard } from '../../core/security/jwt-auth.guard';
import { RolesGuard } from '../../core/security/roles.guard';
import { Roles } from '../../core/security/roles.decorator';
import { CurrentUser } from '../../core/security/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('vitals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post(':patientId')
  @Roles('NURSE', 'ADMIN', 'DOCTOR')
  async recordVitals(
    @Param('patientId') patientId: string,
    @CurrentUser() user: any,
    @Body()
    body: {
      temperature?: number;
      bloodPressure?: string;
      heartRate?: number;
      weight?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      notes?: string;
    },
  ) {
    return this.vitalsService.createVitals(patientId, user.id, body);
  }

  @Get(':patientId')
  @Roles('DOCTOR', 'NURSE', 'ADMIN')
  async getPatientVitals(@Param('patientId') patientId: string) {
    return this.vitalsService.getPatientVitals(patientId);
  }
}
