import { Module } from '@nestjs/common';
import { MedidoresController } from './medidor.controller';
import { MedidoresService } from './medidores.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medidor } from './medidor.entity';
import { ImoveisModule } from '../imoveis/imoveis.module';
import { ConsumoModule } from '../consumo/consumo.module';
import { Leitura } from '../leituras/leitura.entity';

@Module({
  controllers: [MedidoresController],
  providers: [MedidoresService],
  imports: [
    TypeOrmModule.forFeature([Medidor, Leitura]),
    ImoveisModule,
    ConsumoModule,
  ], // Importa Repository de Medidor e o módulo de imóveis
  exports: [MedidoresService], // Exporta o service de medidores
})
export class MedidoresModule {}
