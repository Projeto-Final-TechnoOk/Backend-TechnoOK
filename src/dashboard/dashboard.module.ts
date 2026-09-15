import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ImoveisModule } from '../imoveis/imoveis.module';
import { MedidoresModule } from '../medidores/medidores.module';
import { LeiturasModule } from '../leituras/leituras.module';
import { ConsumoModule } from '../consumo/consumo.module';

@Module({
  providers: [DashboardService],
  controllers: [DashboardController],
  imports: [ImoveisModule, MedidoresModule, LeiturasModule, ConsumoModule],
})
export class DashboardModule {}
