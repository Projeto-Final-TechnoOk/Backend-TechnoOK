import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';

import { Imovel } from './imovel.entity';
import { Leitura } from '../leituras/leitura.entity';

import { CriarImovelDto } from './dtos/criar-imovel.dto';
import { AtualizarImovelDto } from './dtos/atualizar-imovel.dto';
import { ImovelDetalhes } from './types/imovel-detalhes.type';
import { ImoveisPaginados } from './types/imoveis-paginados.type';
import { ConsumoImovel } from './types/consumo-imovel.type';
import { TipoMedidor } from '../medidores/enums/tipo-medidor.enum';
import { PeriodoConsumo } from './enums/periodo-consumo.enum';

@Injectable()
export class ImoveisService {
  constructor(
    @InjectRepository(Imovel)
    private readonly imoveisRepository: Repository<Imovel>,
    @InjectRepository(Leitura)
    private readonly leiturasRepository: Repository<Leitura>,
  ) {}

  // ===========
  // CRUD Básico
  // ===========

  // Lista todos os imóveis cadastrados
  async listarTodos(): Promise<Imovel[]> {
    return this.imoveisRepository.find();
  }

  // Busca um imóvel específico pelo seu ID
  async buscarPorId(id: string): Promise<Imovel> {
    const imovel = await this.imoveisRepository.findOne({
      where: {
        id,
      },
    });

    if (!imovel) {
      throw new NotFoundException('Imóvel não encontrado');
    }
    return imovel;
  }

  // Cria um novo imóvel
  async criar(imovelNovo: CriarImovelDto): Promise<Imovel> {
    const nome = imovelNovo.nome.trim();
    const endereco = imovelNovo.endereco.trim();
    if (!nome || !endereco) {
      throw new BadRequestException(
        "Os campos de 'Nome' e 'Endereço' devem conter algum valor",
      );
    }

    const novoImovel = this.imoveisRepository.create({
      nome,
      endereco,
    });
    return this.imoveisRepository.save(novoImovel);
  }

  // Atualiza os dados de um imóvel existente (Somente os campos recebidos no DTO são alterados)
  async atualizar(
    id: string,
    imovelAtualizado: AtualizarImovelDto,
  ): Promise<Imovel> {
    const imovel = await this.buscarPorId(id);
    if (imovelAtualizado.nome !== undefined) {
      const nome = imovelAtualizado.nome.trim();
      if (!nome) {
        throw new BadRequestException("'Nome' não pode conter apenas espaços.");
      }
      imovel.nome = nome;
    }

    if (imovelAtualizado.endereco !== undefined) {
      const endereco = imovelAtualizado.endereco.trim();
      if (!endereco) {
        throw new BadRequestException(
          "'Endereço' não pode conter apenas espaços.",
        );
      }
      imovel.endereco = endereco;
    }
    return this.imoveisRepository.save(imovel);
  }

  // Deleta um imóvel caso ele não possua nenhum medidor associado
  async deletar(id: string): Promise<{ mensagem: string }> {
    const imovel = await this.buscarComMedidores(id);
    if (imovel.medidores.length > 0) {
      throw new ConflictException(
        'Não é possível excluir um imóvel que possui medidores associados.',
      );
    }

    await this.imoveisRepository.remove(imovel);
    return {
      mensagem: `O imóvel '${imovel.nome}' foi excluído com sucesso`,
    };
  }

  // =========
  // Dashboard
  // =========

  // Retorna a quantidade total de imóveis cadastrados
  async contar(): Promise<number> {
    return this.imoveisRepository.count();
  }

  // =================
  // Tabela de Imóveis
  // =================

  // Busca os imóveis de forma paginada para exibição na tabela do frontend
  async listarPaginado(
    pagina: number,
    limite: number,
  ): Promise<ImoveisPaginados> {
    if (pagina < 1) {
      throw new BadRequestException('A página deve ser maior ou igual a 1.');
    }
    if (limite < 1 || limite > 100) {
      throw new BadRequestException('O limite deve estar entre 1 e 100.');
    }

    const [imoveis, total] = await this.imoveisRepository.findAndCount({
      skip: (pagina - 1) * limite,
      take: limite,
    });

    return {
      dados: imoveis,
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  // ==================
  // Imóvel Específico
  // ==================

  // Busca um imóvel junto com todos os medidores associados a ele
  async buscarComMedidores(id: string): Promise<Imovel> {
    const imovel = await this.imoveisRepository.findOne({
      where: {
        id,
      },
      relations: {
        medidores: true,
      },
    });

    if (!imovel) {
      throw new NotFoundException('Imóvel não encontrado');
    }
    return imovel;
  }

  // Busca as informações utilizadas na parte superior da tela específica de um imóvel
  // - Informações do imóvel
  // - Medidores associados
  // - Última leitura realizada por um de seus medidores
  async buscarComDetalhes(id: string): Promise<ImovelDetalhes> {
    const imovel = await this.imoveisRepository.findOne({
      where: {
        id,
      },
      relations: {
        medidores: true,
      },
    });
    if (!imovel) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    // Busca a leitura mais recente entre todos os medidores pertencentes ao imóvel
    const ultimaLeitura = await this.leiturasRepository.findOne({
      where: {
        medidor: {
          imovel: {
            id,
          },
        },
      },
      relations: {
        medidor: true,
      },
      order: {
        dataHora: 'DESC',
        id: 'DESC',
      },
    });

    return {
      id: imovel.id,
      nome: imovel.nome,
      endereco: imovel.endereco,
      medidores: imovel.medidores.map((medidor) => ({
        id: medidor.id,
        identificador: medidor.identificador,
        tipo: medidor.tipo,
      })),
      ultimaLeitura: ultimaLeitura
        ? {
            dataHora: ultimaLeitura.dataHora,
            valor: Number(ultimaLeitura.valor),
            medidorId: ultimaLeitura.medidor.id,
            medidorIdentificador: ultimaLeitura.medidor.identificador,
          }
        : null,
    };
  }

  // ====================================
  // Gráficos - Tela de Imóvel Específico
  // ====================================

  // Calcula os consumos dos medidores de um determinado tipo pertencentes ao imóvel durante o período selecionado
  async buscarConsumo(
    id: string,
    tipo: TipoMedidor,
    periodo: PeriodoConsumo,
  ): Promise<ConsumoImovel> {
    const imovel = await this.buscarComMedidores(id);

    // Mantém somente os medidores correspondentes ao tipo selecionado
    const medidores = imovel.medidores.filter(
      (medidor) => medidor.tipo === tipo,
    );

    // Gera os intervalos de tempo correspondentes ao período selecionado
    const intervalos = this.gerarIntervalos(periodo);
    const inicioPeriodo = intervalos[0].inicio;
    const fimPeriodo = intervalos[intervalos.length - 1].fim;
    const medidoresComConsumo: ConsumoImovel['medidores'] = [];

    // Calcula separadamente o consumo de cada medidor encontrado
    for (const medidor of medidores) {
      const consumos = await this.calcularConsumosMedidor(
        medidor.id,
        inicioPeriodo,
        fimPeriodo,
        intervalos,
      );
      medidoresComConsumo.push({
        id: medidor.id,
        identificador: medidor.identificador,
        consumos,
      });
    }

    return {
      tipo,
      periodo,
      unidade: this.obterUnidade(tipo),
      intervalos,
      medidores: medidoresComConsumo,
    };
  }

  // =================================
  // Funções Auxiliares dos Gráficos
  // =================================

  // Define quais intervalos devem ser gerados de acordo com o período selecionado
  private gerarIntervalos(periodo: PeriodoConsumo): {
    inicio: Date;
    fim: Date;
    rotulo: string;
  }[] {
    const agora = new Date();
    if (periodo === PeriodoConsumo.HORAS_24) {
      return this.gerarIntervalos24Horas(agora);
    }
    if (periodo === PeriodoConsumo.DIAS_7) {
      return this.gerarIntervalosDias(7, agora);
    }
    return this.gerarIntervalosDias(30, agora);
  }

  // Divide as últimas 24 horas em 24 intervalos consecutivos de uma hora
  private gerarIntervalos24Horas(agora: Date): {
    inicio: Date;
    fim: Date;
    rotulo: string;
  }[] {
    const intervalos: {
      inicio: Date;
      fim: Date;
      rotulo: string;
    }[] = [];

    const inicioPeriodo = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

    for (let i = 0; i < 24; i++) {
      const inicio = new Date(inicioPeriodo.getTime() + i * 60 * 60 * 1000);
      const fim =
        i === 23
          ? new Date(agora)
          : new Date(inicio.getTime() + 60 * 60 * 1000);

      intervalos.push({
        inicio,
        fim,
        rotulo: inicio.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }
    return intervalos;
  }

  // Gera intervalos diários para os últimos 7 ou 30 dias, incluindo o dia atual
  private gerarIntervalosDias(
    quantidadeDias: number,
    agora: Date,
  ): {
    inicio: Date;
    fim: Date;
    rotulo: string;
  }[] {
    const intervalos: {
      inicio: Date;
      fim: Date;
      rotulo: string;
    }[] = [];

    // Descobre o primeiro dia que fará parte do período selecionado
    const primeiroDia = new Date(agora);
    primeiroDia.setHours(0, 0, 0, 0);
    primeiroDia.setDate(primeiroDia.getDate() - (quantidadeDias - 1));
    for (let i = 0; i < quantidadeDias; i++) {
      const inicio = new Date(primeiroDia);
      inicio.setDate(primeiroDia.getDate() + i);
      const proximoDia = new Date(inicio);
      proximoDia.setDate(proximoDia.getDate() + 1);
      const ehHoje = i === quantidadeDias - 1;

      // Para dias anteriores, o intervalo termina no início do próximo dia. Para 24 horas, termina no horário atual.
      const fim = ehHoje ? new Date(agora) : proximoDia;
      intervalos.push({
        inicio,
        fim,
        rotulo: inicio.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
      });
    }
    return intervalos;
  }

  // Calcula o consumo de um medidor em cada intervalo utilizando a diferença entre leituras acumulativas
  private async calcularConsumosMedidor(
    medidorId: string,
    inicioPeriodo: Date,
    fimPeriodo: Date,
    intervalos: {
      inicio: Date;
      fim: Date;
      rotulo: string;
    }[],
  ): Promise<number[]> {
    /*
     * Busca a leitura mais recente que ocorreu antes
     * ou exatamente no início do período.
     *
     * Essa leitura funciona como baseline para calcular
     * o primeiro consumo do período.
     */
    const leituraBaseline = await this.leiturasRepository.findOne({
      where: {
        medidor: {
          id: medidorId,
        },
        dataHora: LessThanOrEqual(inicioPeriodo),
      },
      order: {
        dataHora: 'DESC',
        id: 'DESC',
      },
    });

    // Busca todas as leituras que pertencem ao período analisado
    const leiturasPeriodo = await this.leiturasRepository
      .createQueryBuilder('leitura')
      .where('leitura.medidor_id = :medidorId', {
        medidorId,
      })
      .andWhere('leitura.data_hora > :inicioPeriodo', {
        inicioPeriodo,
      })
      .andWhere('leitura.data_hora <= :fimPeriodo', {
        fimPeriodo,
      })
      .orderBy('leitura.data_hora', 'ASC')
      .addOrderBy('leitura.id', 'ASC')
      .getMany();

    const consumos: number[] = [];

    // Guarda o último valor conhecido para servir como referência para o próximo cálculo
    let valorAnterior: number | null = leituraBaseline
      ? Number(leituraBaseline.valor)
      : null;
    let indiceLeitura = 0;

    // Percorre cada intervalo do período
    for (const intervalo of intervalos) {
      const leiturasDoIntervalo: Leitura[] = [];

      // Separa todas as leituras pertencentes ao intervalo atual
      while (
        indiceLeitura < leiturasPeriodo.length &&
        new Date(leiturasPeriodo[indiceLeitura].dataHora) <= intervalo.fim
      ) {
        leiturasDoIntervalo.push(leiturasPeriodo[indiceLeitura]);
        indiceLeitura++;
      }

      // Se não existir nenhuma leitura no intervalo, o consumo daquele intervalo será zero
      if (leiturasDoIntervalo.length === 0) {
        consumos.push(0);
        continue;
      }

      /*
       * Caso não exista uma leitura anterior ao período,
       * a primeira leitura encontrada passa a ser utilizada
       * como baseline.
       */
      if (valorAnterior === null) {
        valorAnterior = Number(leiturasDoIntervalo[0].valor);
      }

      // Utiliza a última leitura do intervalo para calcular o consumo acumulado naquele intervalo
      const ultimaLeitura = leiturasDoIntervalo[leiturasDoIntervalo.length - 1];
      const valorFinal = Number(ultimaLeitura.valor);

      // Impede a geração de consumo negativo
      const consumo = Math.max(0, valorFinal - valorAnterior);
      consumos.push(Number(consumo.toFixed(3)));

      // O valor final passa a ser a referência para o próximo intervalo
      valorAnterior = valorFinal;
    }
    return consumos;
  }

  // Retorna a unidade de medida correspondente ao tipo de medidor analisado
  private obterUnidade(tipo: TipoMedidor): string {
    switch (tipo) {
      case TipoMedidor.ENERGIA:
        return 'kWh';
      case TipoMedidor.AGUA:
      case TipoMedidor.GAS:
        return 'm³';
    }
  }
}
