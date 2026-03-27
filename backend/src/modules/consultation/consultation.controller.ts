import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { JwtAuthGuard } from '../../core/security/jwt-auth.guard';
import { RolesGuard } from '../../core/security/roles.guard';
import { Roles } from '../../core/security/roles.decorator';
import { CurrentUser } from '../../core/security/current-user.decorator';

@Controller('consultation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DOCTOR', 'ADMIN')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Get(':patientId/notes')
  getNotes(@Param('patientId') patientId: string) {
    return this.consultationService.getPatientNotes(patientId);
  }

  @Get(':patientId/lab-results')
  getLabResults(@Param('patientId') patientId: string) {
    return this.consultationService.getPatientLabResults(patientId);
  }

  @Post(':patientId/note')
  createNote(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
    @Body('notes') notes: string,
  ) {
    return this.consultationService.createNote(user.id, patientId, notes);
  }

  @Post(':patientId/lab')
  orderLab(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
    @Body('testName') testName: string,
  ) {
    return this.consultationService.orderLabTest(user.id, patientId, testName);
  }

  @Post(':patientId/prescription')
  prescribe(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
    @Body('drugName') drugName: string,
    @Body('dosage') dosage: string,
  ) {
    return this.consultationService.prescribeDrug(user.id, patientId, drugName, dosage);
  }
}
