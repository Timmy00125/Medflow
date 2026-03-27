import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { LoginDto } from './dto/login.dto';
import { CreatePatientDto } from './dto/create-patient.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto.email, loginDto.password);
  }

  @Post('signup/patient')
  async signupPatient(@Body() createPatientDto: CreatePatientDto) {
    return this.usersService.registerPatient(createPatientDto);
  }
}
