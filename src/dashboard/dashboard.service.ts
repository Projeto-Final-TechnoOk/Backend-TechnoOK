import { Injectable } from '@nestjs/common';
import { MedidoresService } from '../medidores/medidores.service';
import { LeiturasService } from '../leituras/leituras.service';
import { ConsumoService } from '../consumo/consumo.service';
import { ImoveisService } from '../imoveis/imoveis.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly imoveisService: ImoveisService,
    private readonly medidoresService: MedidoresService,
    private readonly leiturasService: LeiturasService,
    private readonly consumoService: ConsumoService,
  ) {}

  async obterResumo() {
    const [quantidadeImoveis, quantidadeMedidores, leiturasNoMes] =
      await Promise.all([
        this.imoveisService.contar(),
        this.medidoresService.contar(),
        this.leiturasService.contarDoMesAtual(),
      ]);

    return {
      quantidadeImoveis,
      quantidadeMedidores,
      leiturasNoMes,
    };
  }
}
