import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Medidor } from './medidor.entity';
import { Repository } from 'typeorm';
import { CriarMedidorDto } from './dtos/criar-medidor.dto';
import { AtualizarMedidorDto } from './dtos/atualizar-medidor.dto';
import { ImoveisService } from '../imoveis/imoveis.service';
import { MedidoresMapper } from './mappers/medidores.mapper';
import { MedidorListagem } from './types/medidor-listagem.type';

@Injectable()
export class MedidoresService {
  constructor(
    @InjectRepository(Medidor)
    private readonly medidoresRepository: Repository<Medidor>,
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

  // Busca somente um medidor (carrega também todas as informações do imóvel).
  async buscarPorId(id: string): Promise<Medidor> {
    const medidor = await this.medidoresRepository.findOne({
      where: { id },
      relations: {
        imovel: true,
      },
    });

    if (!medidor) {
      // Validação
      throw new NotFoundException('Medidor não encontrado');
    }

    return medidor;
  }

  // Busca somente um medidor (carrega também todas as informações do imóvel e todas as leituras associadas a ele).
  async buscarComImovelELeituras(id: string): Promise<Medidor> {
    const medidor = await this.medidoresRepository.findOne({
      where: { id },
      relations: {
        imovel: true,
        leituras: true,
      },
    });

    if (!medidor) {
      throw new NotFoundException('Medidor não encontrado');
    }

    return medidor;
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
}
