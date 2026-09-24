import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Imovel } from './imovel.entity';
import { Leitura } from '../leituras/leitura.entity';
import { ImovelDetalhes } from './types/imovel-detalhes.type';
import { CriarImovelDto } from './dtos/criar-imovel.dto';
import { AtualizarImovelDto } from './dtos/atualizar-imovel.dto';
import { ImoveisPaginados } from './types/imoveis-paginados.type';
import { TipoMedidor } from '../medidores/enums/tipo-medidor.enum';
import { PeriodoConsumo } from './enums/periodo-consumo.enum';
import { ConsumoImovel } from './types/consumo-imovel.type';

@Injectable()
export class ImoveisService {
  constructor(
    @InjectRepository(Imovel)
    private readonly imoveisRepository: Repository<Imovel>,
    @InjectRepository(Leitura)
    private readonly leiturasRepository: Repository<Leitura>,
  ) {}

  async listarTodos(): Promise<Imovel[]> {
    return this.imoveisRepository.find();
  }

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

  async buscarPorId(id: string): Promise<Imovel> {
    const imovel = await this.imoveisRepository.findOne({
      where: { id },
    });

    if (!imovel) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    return imovel;
  }

  async buscarComMedidores(id: string): Promise<Imovel> {
    const imovel = await this.imoveisRepository.findOne({
      where: { id },
      relations: {
        medidores: true,
      },
    });

    if (!imovel) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    return imovel;
  }

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

  async deletar(id: string): Promise<{ mensagem: string }> {
    const imovel = await this.buscarComMedidores(id);

    if (imovel.medidores.length > 0) {
      throw new ConflictException(
        'Não é possível excluir um imóvel que possui medidores associados.',
      );
    }

    await this.imoveisRepository.remove(imovel);

    return { mensagem: `O imóvel '${imovel.nome}' foi excluído com sucesso` };
  }

  async contar(): Promise<number> {
    return this.imoveisRepository.count();
  }

  // Calculos dos gráficos de imóvel específico

  async buscarConsumo(
    id: string,
    tipo: TipoMedidor,
    periodo: PeriodoConsumo,
  ): Promise<ConsumoImovel> {
    const imovel = await this.buscarComMedidores(id);

    const medidores = imovel.medidores.filter(
      (medidor) => medidor.tipo === tipo,
    );

    const intervalos = this.gerarIntervalos(periodo);

    const inicioPeriodo = intervalos[0].inicio;
    const fimPeriodo = intervalos[intervalos.length - 1].fim;

    const medidoresComConsumo: ConsumoImovel['medidores'] = [];

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

    const primeiroDia = new Date(agora);

    primeiroDia.setHours(0, 0, 0, 0);

    primeiroDia.setDate(primeiroDia.getDate() - (quantidadeDias - 1));

    for (let i = 0; i < quantidadeDias; i++) {
      const inicio = new Date(primeiroDia);

      inicio.setDate(primeiroDia.getDate() + i);

      const proximoDia = new Date(inicio);

      proximoDia.setDate(proximoDia.getDate() + 1);

      const ehHoje = i === quantidadeDias - 1;

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

    let valorAnterior: number | null = leituraBaseline
      ? Number(leituraBaseline.valor)
      : null;

    let indiceLeitura = 0;

    for (const intervalo of intervalos) {
      const leiturasDoIntervalo: Leitura[] = [];

      while (
        indiceLeitura < leiturasPeriodo.length &&
        new Date(leiturasPeriodo[indiceLeitura].dataHora) <= intervalo.fim
      ) {
        leiturasDoIntervalo.push(leiturasPeriodo[indiceLeitura]);

        indiceLeitura++;
      }

      if (leiturasDoIntervalo.length === 0) {
        consumos.push(0);

        continue;
      }

      /*
       * Caso não exista leitura anterior ao período,
       * a primeira leitura encontrada se torna o baseline.
       */
      if (valorAnterior === null) {
        valorAnterior = Number(leiturasDoIntervalo[0].valor);
      }

      const ultimaLeitura = leiturasDoIntervalo[leiturasDoIntervalo.length - 1];

      const valorFinal = Number(ultimaLeitura.valor);

      const consumo = Math.max(0, valorFinal - valorAnterior);

      consumos.push(Number(consumo.toFixed(3)));

      valorAnterior = valorFinal;
    }

    return consumos;
  }

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
