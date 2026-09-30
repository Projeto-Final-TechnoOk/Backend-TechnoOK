import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Medidor } from './medidor.entity';
import { Leitura } from '../leituras/leitura.entity';

import { ImoveisService } from '../imoveis/imoveis.service';

import { CriarMedidorDto } from './dtos/criar-medidor.dto';
import { AtualizarMedidorDto } from './dtos/atualizar-medidor.dto';

import { MedidorDetalhes } from './types/medidor-detalhes.type';
import { MedidorListagem } from './types/medidor-listagem.type';
import { MedidoresPaginados } from './types/medidores-paginados.type';
import { ComparacaoConsumoMedidor } from './types/comparacao-consumo-medidor.type';
import { PeriodoConsumo } from '../imoveis/enums/periodo-consumo.enum';

import { MedidoresMapper } from './mappers/medidores.mapper';

@Injectable()
export class MedidoresService {
  constructor(
    @InjectRepository(Medidor)
    private readonly medidoresRepository: Repository<Medidor>,
    @InjectRepository(Leitura)
    private readonly leiturasRepository: Repository<Leitura>,
    private readonly imoveisService: ImoveisService,
  ) {}

  // ===========
  // CRUD Básico
  // ===========

  // Lista todos os medidores cadastrados (Cada medidor carrega também o ID e o nome do imóvel associado)
  async listarTodos(): Promise<MedidorListagem[]> {
    const medidores = await this.medidoresRepository.find({
      relations: {
        imovel: true,
      },
    });

    return medidores.map((medidor) =>
      MedidoresMapper.entityParaListagem(medidor),
    );
  }

  // Busca um medidor pelo seu ID (Carrega também todas as informações do imóvel associado)
  async buscarPorId(id: string): Promise<Medidor> {
    const medidor = await this.medidoresRepository.findOne({
      where: {
        id,
      },
      relations: {
        imovel: true,
      },
    });

    if (!medidor) {
      throw new NotFoundException('Medidor não encontrado');
    }
    return medidor;
  }

  // Cria um novo medidor e associa o registro ao imóvel informado no DTO
  async criar(medidorNovo: CriarMedidorDto): Promise<Medidor> {
    const identificador = medidorNovo.identificador.trim();
    const imovelId = medidorNovo.imovelId.trim();
    if (!identificador || !imovelId) {
      throw new BadRequestException(
        "Os campos de 'Identificador' e 'Id do Imóvel' devem conter algum valor",
      );
    }

    const imovel = await this.imoveisService.buscarPorId(imovelId);
    const novoMedidor = this.medidoresRepository.create({
      identificador,
      tipo: medidorNovo.tipo,
      imovel,
    });
    return this.medidoresRepository.save(novoMedidor);
  }

  // Atualiza os dados de um medidor existente (Somente os campos recebidos no DTO são alterados)
  async atualizar(
    id: string,
    medidorAtualizado: AtualizarMedidorDto,
  ): Promise<Medidor> {
    const medidor = await this.buscarPorId(id);
    if (medidorAtualizado.identificador !== undefined) {
      const identificador = medidorAtualizado.identificador.trim();

      if (!identificador) {
        throw new BadRequestException(
          "'Identificador' não pode conter apenas espaços.",
        );
      }
      medidor.identificador = identificador;
    }

    if (medidorAtualizado.tipo !== undefined) {
      medidor.tipo = medidorAtualizado.tipo;
    }
    if (medidorAtualizado.imovelId !== undefined) {
      const imovelId = medidorAtualizado.imovelId.trim();
      if (!imovelId) {
        throw new BadRequestException(
          "'Id do Imóvel' não pode conter apenas espaços.",
        );
      }

      medidor.imovel = await this.imoveisService.buscarPorId(imovelId);
    }

    return this.medidoresRepository.save(medidor);
  }

  // Deleta um medidor e todas as leituras associadas a ele !!! As leituras são removidas automaticamente pela relação com cascade !!!
  async deletar(id: string): Promise<{ mensagem: string }> {
    const medidor = await this.buscarPorId(id);
    await this.medidoresRepository.remove(medidor);

    return {
      mensagem: `O medidor de identificador '${medidor.identificador}' e suas leituras foram excluídos com sucesso`,
    };
  }

  // =========
  // Dashboard
  // =========

  // Retorna a quantidade total de medidores cadastrados
  async contar(): Promise<number> {
    return this.medidoresRepository.count();
  }

  // ===================
  // Tabela de Medidores
  // ===================

  // Busca os medidores de forma paginada para exibição na tabela (Cada medidor também retorna as informações necessárias do imóvel)
  async listarPaginado(
    pagina: number,
    limite: number,
  ): Promise<MedidoresPaginados> {
    if (pagina < 1) {
      throw new BadRequestException('A página deve ser maior ou igual a 1.');
    }
    if (limite < 1 || limite > 100) {
      throw new BadRequestException('O limite deve estar entre 1 e 100.');
    }

    const [medidores, total] = await this.medidoresRepository.findAndCount({
      relations: {
        imovel: true,
      },
      order: {
        imovel: {
          nome: 'ASC',
        },
      },
      skip: (pagina - 1) * limite,
      take: limite,
    });
    const dados = medidores.map((medidor) =>
      MedidoresMapper.entityParaListagem(medidor),
    );

    return {
      dados,
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  // ===================
  // Medidor Específico
  // ===================

  // Busca as informações utilizadas na parte superior da tela específica de um medidor
  // Retorna: informações do medidor, imóvel associado, última leitura e as 50 últimas leituras.
  async buscarComDetalhes(id: string): Promise<MedidorDetalhes> {
    const medidor = await this.medidoresRepository.findOne({
      where: {
        id,
      },
      relations: {
        imovel: true,
      },
    });

    if (!medidor) {
      throw new NotFoundException('Medidor não encontrado');
    }

    const ultimasLeituras = await this.leiturasRepository.find({
      where: {
        medidor: {
          id,
        },
      },
      order: {
        dataHora: 'DESC',
        id: 'DESC',
      },
      take: 50,
    });

    const ultimaLeitura = ultimasLeituras[0] ?? null;

    return {
      id: medidor.id,
      identificador: medidor.identificador,
      tipo: medidor.tipo,
      imovel: {
        id: medidor.imovel.id,
        nome: medidor.imovel.nome,
        endereco: medidor.imovel.endereco,
      },
      ultimaLeitura: ultimaLeitura
        ? {
            id: ultimaLeitura.id,
            dataHora: ultimaLeitura.dataHora,
            valor: Number(ultimaLeitura.valor),
          }
        : null,
      ultimasLeituras: ultimasLeituras.map((leitura) => ({
        id: leitura.id,
        dataHora: leitura.dataHora,
        valor: Number(leitura.valor),
      })),
    };
  }

  // =================================
  // Comparação de Consumo do Medidor
  // =================================

  // Compara o consumo do medidor atual com a média de todos os outros medidores do mesmo tipo no sistema
  async buscarComparacaoConsumo(
    id: string,
    periodo: PeriodoConsumo,
  ): Promise<ComparacaoConsumoMedidor> {
    // Busca o medidor atual
    const medidorAtual = await this.buscarPorId(id);

    // Busca todos os medidores do sistema que possuem o mesmo tipo do medidor atual
    const medidoresMesmoTipo = await this.medidoresRepository.find({
      where: {
        tipo: medidorAtual.tipo,
      },
      relations: {
        imovel: true,
      },
    });

    /*
     * Um imóvel pode possuir mais de um medidor do mesmo tipo.
     * Por isso, são armazenados somente os IDs únicos dos imóveis, evitando calcular o consumo do mesmo imóvel mais de uma vez.
     */
    const imoveisIds = [
      ...new Set(medidoresMesmoTipo.map((medidor) => medidor.imovel.id)),
    ];

    /*
     * Reutiliza o cálculo de consumo já existente no ImoveisService.
     * Cada retorno contém todos os medidores daquele tipo pertencentes ao imóvel analisado.
     */
    const consumosPorImovel = await Promise.all(
      imoveisIds.map((imovelId) =>
        this.imoveisService.buscarConsumo(imovelId, medidorAtual.tipo, periodo),
      ),
    );

    // Junta os medidores de todos os imóveis em uma única lista
    const medidoresComConsumo = consumosPorImovel.flatMap(
      (consumo) => consumo.medidores,
    );

    // Remove o próprio medidor da comparação
    const outrosMedidores = medidoresComConsumo.filter(
      (medidor) => medidor.id !== medidorAtual.id,
    );

    // Obtém a unidade correspondente ao tipo do medidor
    const unidade = consumosPorImovel[0]?.unidade ?? '';

    // Caso não exista outro medidor do mesmo tipo, informa que não há uma média disponível
    if (outrosMedidores.length === 0) {
      return {
        tipo: medidorAtual.tipo,
        periodo,
        unidade,
        mediaOutrosMedidores: null,
        quantidadeOutrosMedidores: 0,
      };
    }

    // Calcula o consumo total de cada um dos outros medidores durante o período
    const consumosTotais = outrosMedidores.map((medidor) =>
      medidor.consumos.reduce((soma, consumo) => soma + consumo, 0),
    );

    // Calcula a média global de consumo dos outros medidores do mesmo tipo
    const media =
      consumosTotais.reduce((soma, consumo) => soma + consumo, 0) /
      consumosTotais.length;

    return {
      tipo: medidorAtual.tipo,
      periodo,
      unidade,
      mediaOutrosMedidores: Number(media.toFixed(3)),
      quantidadeOutrosMedidores: outrosMedidores.length,
    };
  }
}
