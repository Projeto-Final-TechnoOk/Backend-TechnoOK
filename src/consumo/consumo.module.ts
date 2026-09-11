import { Module } from '@nestjs/common';
import { ConsumoService } from './consumo.service';
import { Leitura } from '../leituras/leitura.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  providers: [ConsumoService],
  imports: [TypeOrmModule.forFeature([Leitura])],
  exports: [ConsumoService],
})
export class ConsumoModule {}
