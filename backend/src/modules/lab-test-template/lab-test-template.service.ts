import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LabTestTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.client.labTestTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(name: string, description?: string, category?: string) {
    const existing = await this.prisma.client.labTestTemplate.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictException('Lab test with this name already exists');
    }
    return this.prisma.client.labTestTemplate.create({
      data: { name, description, category, isDefault: false },
    });
  }

  async delete(id: string) {
    return this.prisma.client.labTestTemplate.delete({ where: { id } });
  }
}
