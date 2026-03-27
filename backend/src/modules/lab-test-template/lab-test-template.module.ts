import { Module } from '@nestjs/common';
import { LabTestTemplateController } from './lab-test-template.controller';
import { LabTestTemplateService } from './lab-test-template.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LabTestTemplateController],
  providers: [LabTestTemplateService],
  exports: [LabTestTemplateService],
})
export class LabTestTemplateModule {}
