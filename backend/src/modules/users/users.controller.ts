import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { JwtAuthGuard } from '../../core/security/jwt-auth.guard';
import { RolesGuard } from '../../core/security/roles.guard';
import { Roles } from '../../core/security/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('staff')
  @Roles('ADMIN')
  createStaff(@Body() createStaffDto: CreateStaffDto) {
    return this.usersService.createStaff(createStaffDto);
  }

  @Post('patient')
  @Roles('ADMIN', 'NURSE', 'DOCTOR')
  createPatient(@Body() createPatientDto: CreatePatientDto) {
    return this.usersService.createPatient(createPatientDto);
  }

  @Get('staff')
  @Roles('ADMIN')
  getStaff() {
    return this.usersService.findStaff();
  }

  @Get('doctors')
  @Roles('ADMIN', 'NURSE')
  getDoctors() {
    return this.usersService.findDoctors();
  }
}
