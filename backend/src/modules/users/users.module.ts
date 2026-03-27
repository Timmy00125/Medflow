import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../../core/security/jwt.strategy';

const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_KEY';

@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [UsersService, JwtStrategy],
  controllers: [UsersController, AuthController],
  exports: [UsersService],
})
export class UsersModule {}
