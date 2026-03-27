import {
  Controller,
  Get,
  Param,
  UseGuards,
  Put,
  Post,
  Body,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../../core/security/jwt-auth.guard';
import { RolesGuard } from '../../core/security/roles.guard';
import { Roles } from '../../core/security/roles.decorator';
import { DepartmentState } from '@prisma/client';
import { CurrentUser } from '../../core/security/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('queue')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('triage')
  @Roles('ADMIN', 'NURSE')
  getTriageQueue() {
    return this.queueService.getQueueByState(['AWAITING_TRIAGE']);
  }

  @Get('doctor')
  @Roles('ADMIN', 'DOCTOR')
  getDoctorQueue(@CurrentUser() user: User) {
    if (user.role === 'DOCTOR') {
      return this.queueService.getQueueByState(
        ['AWAITING_DOCTOR', 'AWAITING_DOCTOR_REVIEW'],
        { assignedDoctorId: user.id },
      );
    }
    return this.queueService.getQueueByState([
      'AWAITING_DOCTOR',
      'AWAITING_DOCTOR_REVIEW',
    ]);
  }

  @Get('nurse')
  @Roles('ADMIN', 'NURSE')
  getNurseQueue() {
    return this.queueService.getQueueByState(['AWAITING_DOCTOR_REVIEW']);
  }

  @Get('doctors')
  @Roles('ADMIN', 'NURSE')
  getAssignableDoctors() {
    return this.queueService.getAssignableDoctors();
  }

  @Get('laboratory')
  @Roles('ADMIN', 'LAB_TECH')
  getLabQueue() {
    return this.queueService.getQueueByState(['AWAITING_LAB']);
  }

  @Get('pharmacy')
  @Roles('ADMIN', 'PHARMACIST')
  getPharmacyQueue() {
    return this.queueService.getQueueByState(['AWAITING_PHARMACY']);
  }

  @Get('patient/:id')
  getPatientState(@Param('id') id: string) {
    return this.queueService.getPatientState(id);
  }

  @Put('advance/:patientId')
  @Roles('ADMIN', 'NURSE', 'DOCTOR')
  advancePatientState(
    @Param('patientId') patientId: string,
    @Body('newState') newState: DepartmentState,
    @Body('assignedDoctorId') assignedDoctorId?: string,
  ) {
    return this.queueService.advanceState(patientId, newState, {
      assignedDoctorId,
    });
  }

  @Post('assign-doctor/:patientId')
  @Roles('ADMIN', 'NURSE')
  assignPatientToDoctor(
    @Param('patientId') patientId: string,
    @Body('doctorId') doctorId: string,
  ) {
    return this.queueService.assignPatientToDoctor(patientId, doctorId);
  }
}
