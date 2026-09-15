import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Imovel } from './imovel.entity';
import { CriarImovelDto } from './dtos/criar-imovel.dto';
import { AtualizarImovelDto } from './dtos/atualizar-imovel.dto';

@Injectable()
export class ImoveisService {
  constructor(
    @InjectRepository(Imovel)
    private readonly imoveisRepository: Repository<Imovel>,
  ) {}

  async listarTodos(): Promise<Imovel[]> {
    return this.imoveisRepository.find();
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
}
