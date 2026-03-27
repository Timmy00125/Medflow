import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { QueueModule } from './modules/queue/queue.module';
import { ConsultationModule } from './modules/consultation/consultation.module';
import { LaboratoryModule } from './modules/laboratory/laboratory.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    QueueModule,
    ConsultationModule,
    LaboratoryModule,
    PharmacyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
