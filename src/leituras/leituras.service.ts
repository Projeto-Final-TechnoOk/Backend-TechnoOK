import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Leitura } from './leitura.entity';
import { CriarLeituraDto } from './dtos/criar-leitura.dto';
import { MedidoresService } from '../medidores/medidores.service';
import { InjectRepository } from '@nestjs/typeorm';
import { LeiturasMapper } from './mappers/leituras.mapper';
import { LeiturasPaginadas } from './types/leituras-paginadas.type';

@Injectable()
export class LeiturasService {
  constructor(
    @InjectRepository(Leitura)
    private readonly leiturasRepository: Repository<Leitura>,
    private readonly medidoresService: MedidoresService,
  ) {}

  async listarTodos() {
    return this.leiturasRepository.find();
  }

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

  async buscarPorId(id: string): Promise<Leitura> {
    const leitura = await this.leiturasRepository.findOne({
      where: { id },
      relations: {
        medidor: true,
      },
    });

    if (!leitura) {
      throw new NotFoundException('Leitura não encontrada');
    }
    return leitura;
  }

  async criar(leituraNova: CriarLeituraDto): Promise<Leitura> {
    const medidorId = leituraNova.medidorId.trim();

    if (!medidorId) {
      throw new BadRequestException(
        "O campo de 'Id do Medidor' deve conter algum valor",
      );
    }
    const medidor = await this.medidoresService.buscarPorId(medidorId);
    const novaLeitura = this.leiturasRepository.create({
      dataHora: new Date(),
      valor: leituraNova.valor,
      medidor,
    });

    return this.leiturasRepository.save(novaLeitura);
  }

  async contar(): Promise<number> {
    return this.leiturasRepository.count();
  }
}
