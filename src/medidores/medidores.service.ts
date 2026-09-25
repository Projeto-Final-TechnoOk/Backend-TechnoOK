import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Medidor } from './medidor.entity';
import { Repository } from 'typeorm';
import { Leitura } from '../leituras/leitura.entity';
import { MedidorDetalhes } from './types/medidor-detalhes.type';
import { CriarMedidorDto } from './dtos/criar-medidor.dto';
import { AtualizarMedidorDto } from './dtos/atualizar-medidor.dto';
import { ImoveisService } from '../imoveis/imoveis.service';
import { MedidoresMapper } from './mappers/medidores.mapper';
import { MedidorListagem } from './types/medidor-listagem.type';
import { MedidoresPaginados } from './types/medidores-paginados.type';
import { PeriodoConsumo } from '../imoveis/enums/periodo-consumo.enum';
import { ComparacaoConsumoMedidor } from './types/comparacao-consumo-medidor.type';

@Injectable()
export class MedidoresService {
  constructor(
    @InjectRepository(Medidor)
    private readonly medidoresRepository: Repository<Medidor>,
    @InjectRepository(Leitura)
    private readonly leiturasRepository: Repository<Leitura>,
    private readonly imoveisService: ImoveisService,
  ) {}

  // Lista todos os medidores (cada medidor carrega também o id e o nome do imóvel).
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

  // Busca somente um medidor (carrega também todas as informações do imóvel).
  async buscarPorId(id: string): Promise<Medidor> {
    const medidor = await this.medidoresRepository.findOne({
      where: { id },
      relations: {
        imovel: true,
      },
    });

    if (!medidor) {
      throw new NotFoundException('Medidor não encontrado');
    }

    return medidor;
  }

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

  async buscarComparacaoConsumo(
    id: string,
    periodo: PeriodoConsumo,
  ): Promise<ComparacaoConsumoMedidor> {
    // Busca o medidor atual para descobrir seu tipo
    const medidorAtual = await this.buscarPorId(id);

    // Busca todos os medidores do sistema que possuem o mesmo tipo
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
     * Por isso guardamos somente os IDs únicos dos imóveis,
     * evitando calcular o consumo do mesmo imóvel mais de uma vez.
     */
    const imoveisIds = [
      ...new Set(medidoresMesmoTipo.map((medidor) => medidor.imovel.id)),
    ];

    /*
     * Reutiliza o cálculo de consumo que já existe no ImoveisService.
     * Cada retorno contém todos os medidores daquele tipo
     * pertencentes ao imóvel.
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

    const unidade = consumosPorImovel[0]?.unidade ?? '';

    // Caso não exista nenhum outro medidor daquele tipo
    if (outrosMedidores.length === 0) {
      return {
        tipo: medidorAtual.tipo,
        periodo,
        unidade,
        mediaOutrosMedidores: null,
        quantidadeOutrosMedidores: 0,
      };
    }

    // Calcula o consumo total de cada um dos outros medidores
    const consumosTotais = outrosMedidores.map((medidor) =>
      medidor.consumos.reduce((soma, consumo) => soma + consumo, 0),
    );

    // Calcula a média global dos outros medidores
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

  // Cria um novo registro de medidor.
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

  // Atualiza um registro de medidor.
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

  // Deleta um regitro de medidor e todas as leituras associadas a ele.
  async deletar(id: string): Promise<{ mensagem: string }> {
    const medidor = await this.buscarPorId(id);

    await this.medidoresRepository.remove(medidor);

    return {
      mensagem: `O medidor de identificador '${medidor.identificador}' e suas leituras foram excluídos com sucesso`,
    };
  }

  async contar(): Promise<number> {
    return this.medidoresRepository.count();
  }
}
