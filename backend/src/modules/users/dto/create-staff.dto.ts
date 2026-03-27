import { Role } from '@prisma/client';

export class CreateStaffDto {
  email!: string;
  name!: string;
  password!: string;
  role!: Role;
}
