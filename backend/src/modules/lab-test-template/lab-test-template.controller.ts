import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { LabTestTemplateService } from './lab-test-template.service';
import { JwtAuthGuard } from '../../core/security/jwt-auth.guard';
import { RolesGuard } from '../../core/security/roles.guard';
import { Roles } from '../../core/security/roles.decorator';

@Controller('lab-test-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabTestTemplateController {
  constructor(private readonly labTestTemplateService: LabTestTemplateService) {}

  @Get()
  @Roles('ADMIN', 'DOCTOR', 'PHARMACIST', 'LAB_TECH', 'NURSE')
  getAll() {
    return this.labTestTemplateService.getAll();
  }

  @Post()
  @Roles('ADMIN', 'LAB_TECH')
  create(@Body() body: { name: string; description?: string; category?: string }) {
    return this.labTestTemplateService.create(body.name, body.description, body.category);
  }

  @Delete(':id')
  @Roles('ADMIN', 'LAB_TECH')
  delete(@Param('id') id: string) {
    return this.labTestTemplateService.delete(id);
  }
}
