import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { JwtAuthGuard } from '../../core/security/jwt-auth.guard';
import { RolesGuard } from '../../core/security/roles.guard';
import { Roles } from '../../core/security/roles.decorator';
import { CurrentUser } from '../../core/security/current-user.decorator';

@Controller('pharmacy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Get('worklist')
  @Roles('PHARMACIST', 'ADMIN')
  getWorklist() {
    return this.pharmacyService.getWorklist();
  }

  @Post(':rxId/dispense')
  @Roles('PHARMACIST', 'ADMIN')
  dispense(
    @CurrentUser() user: any,
    @Param('rxId') rxId: string,
  ) {
    return this.pharmacyService.dispense(rxId, user.id);
  }

  @Post('inventory')
  @Roles('PHARMACIST', 'ADMIN')
  addInventory(@Body('drugName') drugName: string, @Body('quantity') quantity: number) {
    return this.pharmacyService.addInventory(drugName, quantity);
  }

  @Get('inventory')
  @Roles('PHARMACIST', 'ADMIN', 'DOCTOR')
  getInventory() {
    return this.pharmacyService.getInventory();
  }
}
