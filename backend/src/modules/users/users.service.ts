import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { CreateStaffDto } from './dto/create-staff.dto';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await argon2.verify(user.password, pass);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async createStaff(dto: CreateStaffDto) {
    const existingUser = await this.prisma.client.user.findUnique({ where: { email: dto.email }});
    if (existingUser) throw new BadRequestException('Email already in use');

    if (dto.role === 'PATIENT') throw new BadRequestException('Use createPatient for patients');

    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.prisma.client.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: dto.role,
      },
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async createPatient(dto: CreatePatientDto) {
    const user = await this.createPatientAccount(dto);

    return { id: user.id, email: user.email, name: user.name, role: user.role, patientFlow: user.patientFlow };
  }

  async registerPatient(dto: CreatePatientDto) {
    const user = await this.createPatientAccount(dto);
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async findStaff() {
    return this.prisma.client.user.findMany({
      where: { role: { not: 'PATIENT' } },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  }

  private async createPatientAccount(dto: CreatePatientDto) {
    const existingUser = await this.prisma.client.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new BadRequestException('Email already in use');

    const hashedPassword = await argon2.hash(dto.password);
    return this.prisma.client.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: 'PATIENT',
        patientFlow: {
          create: {
            currentState: 'AWAITING_TRIAGE',
          },
        },
      },
      include: {
        patientFlow: true,
      },
    });
  }
}
