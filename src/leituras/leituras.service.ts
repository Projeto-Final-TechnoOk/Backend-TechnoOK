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
import { LeituraListagem } from './types/leitura-listagem.type';
import { LeiturasMapper } from './mappers/leituras.mapper';

@Injectable()
export class LeiturasService {
  constructor(
    @InjectRepository(Leitura)
    private readonly leiturasRepository: Repository<Leitura>,
    private readonly medidoresService: MedidoresService,
  ) {}

  async listarTodos(): Promise<LeituraListagem[]> {
    const leituras = await this.leiturasRepository.find({
      relations: {
        medidor: true,
      },
    });

    return leituras.map((leitura) =>
      LeiturasMapper.entityParaListagem(leitura),
    );
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
