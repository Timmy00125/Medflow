import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LaboratoryService } from './laboratory.service';
import { JwtAuthGuard } from '../../core/security/jwt-auth.guard';
import { RolesGuard } from '../../core/security/roles.guard';
import { Roles } from '../../core/security/roles.decorator';
import { CurrentUser } from '../../core/security/current-user.decorator';

@Controller('laboratory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LAB_TECH', 'ADMIN')
export class LaboratoryController {
  constructor(private readonly labService: LaboratoryService) {}

  @Get('worklist')
  getWorklist() {
    return this.labService.getWorklist();
  }

  @Post(':testId/result')
  uploadResult(
    @CurrentUser() user: any,
    @Param('testId') testId: string,
    @Body('resultData') resultData: string,
  ) {
    return this.labService.uploadResult(testId, user.id, resultData);
  }
}
