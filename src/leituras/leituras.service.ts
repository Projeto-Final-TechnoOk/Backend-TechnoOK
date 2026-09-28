import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Leitura } from './leitura.entity';

import { CriarLeituraDto } from './dtos/criar-leitura.dto';

import { MedidoresService } from '../medidores/medidores.service';

import { LeiturasMapper } from './mappers/leituras.mapper';

import { LeiturasPaginadas } from './types/leituras-paginadas.type';

@Injectable()
export class LeiturasService {
  constructor(
    @InjectRepository(Leitura)
    private readonly leiturasRepository: Repository<Leitura>,
    private readonly medidoresService: MedidoresService,
  ) {}

  // ===========
  // CRUD Básico
  // ===========

  // Lista todas as leituras cadastradas
  async listarTodos(): Promise<Leitura[]> {
    return this.leiturasRepository.find();
  }

  // Busca uma leitura específica pelo seu ID (Carrega também o medidor associado à leitura)
  async buscarPorId(id: string): Promise<Leitura> {
    const leitura = await this.leiturasRepository.findOne({
      where: {
        id,
      },
      relations: {
        medidor: true,
      },
    });

    if (!leitura) {
      throw new NotFoundException('Leitura não encontrada');
    }
    return leitura;
  }

  // Cria uma nova leitura para o medidor informado (O valor pode ser informado manualmente ou gerado automaticamente)
  async criar(leituraNova: CriarLeituraDto): Promise<Leitura> {
    const medidorId = leituraNova.medidorId.trim();
    if (!medidorId) {
      throw new BadRequestException(
        "O campo de 'Id do Medidor' deve conter algum valor",
      );
    }

    // Busca o medidor que será associado à nova leitura
    const medidor = await this.medidoresService.buscarPorId(medidorId);

    // Busca a última leitura registrada para utilizar seu valor como referência para a nova leitura
    const ultimaLeitura = await this.leiturasRepository.findOne({
      where: {
        medidor: {
          id: medidorId,
        },
      },
      order: {
        dataHora: 'DESC',
        id: 'DESC',
      },
    });

    const ultimoValor = ultimaLeitura ? Number(ultimaLeitura.valor) : 0;
    let valor: number;

    // Caso o valor tenha sido informado manualmente, verifica se ele não é menor que a última leitura
    if (leituraNova.valor !== undefined) {
      if (leituraNova.valor < ultimoValor) {
        throw new BadRequestException(
          `O valor da leitura não pode ser menor que a última leitura registrada (${ultimoValor.toFixed(3)}).`,
        );
      }
      valor = leituraNova.valor;
    } else {
      // Caso nenhum valor seja informado, gera um incremento aleatório sobre a última leitura
      const incremento = this.gerarIncrementoAleatorio();
      valor = ultimoValor + incremento;
    }

    const novaLeitura = this.leiturasRepository.create({
      dataHora: new Date(),
      valor,
      medidor,
    });

    return this.leiturasRepository.save(novaLeitura);
  }

  // =========
  // Dashboard
  // =========

  // Retorna a quantidade total de leituras cadastradas
  async contar(): Promise<number> {
    return this.leiturasRepository.count();
  }

  // ==================
  // Tabela de Leituras
  // ==================

  // Busca as leituras de forma paginada para exibição na tabela (Cada leitura carrega também as informações necessárias do medidor)
  async listarPaginado(
    pagina: number,
    limite: number,
  ): Promise<LeiturasPaginadas> {
    if (pagina < 1) {
      throw new BadRequestException('A página deve ser maior ou igual a 1.');
    }
    if (limite < 1 || limite > 100) {
      throw new BadRequestException('O limite deve estar entre 1 e 100.');
    }

    const [leituras, total] = await this.leiturasRepository.findAndCount({
      relations: {
        medidor: true,
      },
      order: {
        dataHora: 'DESC',
      },
      skip: (pagina - 1) * limite,
      take: limite,
    });

    // Converte as entidades para o formato utilizado pela tabela de leituras no frontend
    const dados = leituras.map((leitura) =>
      LeiturasMapper.entityParaListagem(leitura),
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
  // Funções Auxiliares
  // ===================

  // Gera um incremento aleatório entre 0 e 40 com precisão de até 3 casas decimais
  private gerarIncrementoAleatorio(): number {
    const minimo = 0;
    const maximo = 40000;
    const incremento =
      Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;
    return incremento / 1000;
  }
}
