import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DrugService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.client.drug.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(name: string, description?: string) {
    if (!name || !name.trim()) {
      throw new BadRequestException('Drug name is required');
    }
    const trimmedName = name.trim();
    const existing = await this.prisma.client.drug.findUnique({
      where: { name: trimmedName },
    });
    if (existing) {
      throw new ConflictException('Drug with this name already exists');
    }
    return this.prisma.client.drug.create({
      data: { name: trimmedName, description, isDefault: false },
    });
  }

  async delete(id: string) {
    return this.prisma.client.drug.delete({ where: { id } });
  }
}
