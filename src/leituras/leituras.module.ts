import { Module } from '@nestjs/common';
import { LeiturasController } from './leituras.controller';
import { LeiturasService } from './leituras.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Leitura } from './leitura.entity';
import { MedidoresModule } from '../medidores/medidores.module';

@Module({
  controllers: [LeiturasController],
  providers: [LeiturasService],
  imports: [TypeOrmModule.forFeature([Leitura]), MedidoresModule],
  exports: [LeiturasService],
})
export class LeiturasModule {}
