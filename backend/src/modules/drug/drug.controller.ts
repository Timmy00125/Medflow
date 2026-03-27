import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DrugService } from './drug.service';
import { JwtAuthGuard } from '../../core/security/jwt-auth.guard';
import { RolesGuard } from '../../core/security/roles.guard';
import { Roles } from '../../core/security/roles.decorator';

@Controller('drugs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DrugController {
  constructor(private readonly drugService: DrugService) {}

  @Get()
  @Roles('ADMIN', 'DOCTOR', 'PHARMACIST', 'LAB_TECH', 'NURSE')
  getAll() {
    return this.drugService.getAll();
  }

  @Post()
  @Roles('ADMIN', 'PHARMACIST')
  create(@Body() body: { name: string; description?: string }) {
    return this.drugService.create(body.name, body.description);
  }

  @Delete(':id')
  @Roles('ADMIN', 'PHARMACIST')
  delete(@Param('id') id: string) {
    return this.drugService.delete(id);
  }
}
