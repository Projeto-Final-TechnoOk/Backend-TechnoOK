import { Module } from '@nestjs/common';
import { ConsumoService } from './consumo.service';
import { Leitura } from '../leituras/leitura.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medidor } from '../medidores/medidor.entity';

@Module({
  providers: [ConsumoService],
  imports: [TypeOrmModule.forFeature([Leitura, Medidor])],
  exports: [ConsumoService],
})
export class ConsumoModule {}
