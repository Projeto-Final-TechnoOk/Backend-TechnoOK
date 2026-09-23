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
import { ImoveisPaginados } from './types/imoveis-paginados.type';

@Injectable()
export class ImoveisService {
  constructor(
    @InjectRepository(Imovel)
    private readonly imoveisRepository: Repository<Imovel>,
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
