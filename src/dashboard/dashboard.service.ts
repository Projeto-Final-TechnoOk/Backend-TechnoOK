import { Injectable } from '@nestjs/common';

import { ImoveisService } from '../imoveis/imoveis.service';
import { MedidoresService } from '../medidores/medidores.service';
import { LeiturasService } from '../leituras/leituras.service';
import { ConsumoService } from '../consumo/consumo.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly imoveisService: ImoveisService,
    private readonly medidoresService: MedidoresService,
    private readonly leiturasService: LeiturasService,
    private readonly consumoService: ConsumoService,
  ) {}

  // ===================
  // Resumo do Dashboard
  // ===================

  // Busca em paralelo os dados necessários para preencher os cards de resumo apresentados no Dashboard
  async obterResumo() {
    /*
     * Promise.all executa todas as consultas ao mesmo tempo,
     * evitando esperar uma consulta terminar para iniciar a próxima.
     */
    const [
      quantidadeImoveis,
      quantidadeMedidores,
      leiturasNoMes,
      mediasConsumo,
    ] = await Promise.all([
      // Quantidade total de imóveis cadastrados
      this.imoveisService.contar(),

      // Quantidade total de medidores cadastrados
      this.medidoresService.contar(),

      // Quantidade de leituras retornada pelo LeiturasService
      this.leiturasService.contar(),

      // Média de consumo do mês atual separada por Energia, Água e Gás
      this.consumoService.calcularMediaMesAtualPorTipo(),
    ]);

    // Organiza os dados no formato esperado pelo frontend
    return {
      quantidadeImoveis,
      quantidadeMedidores,
      leiturasNoMes,
      mediaEnergia: mediasConsumo.energia,
      mediaAgua: mediasConsumo.agua,
      mediaGas: mediasConsumo.gas,
    };
  }
}
