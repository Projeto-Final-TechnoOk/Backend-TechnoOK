import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TestesModule } from '../../config/testes.module';

import { ImoveisModule } from '../../../src/imoveis/imoveis.module';
import { ImoveisService } from '../../../src/imoveis/imoveis.service';

import { Imovel } from '../../../src/imoveis/imovel.entity';
import { Medidor } from '../../../src/medidores/medidor.entity';
import { Leitura } from '../../../src/leituras/leitura.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ImoveisService - Integração', () => {
  let module: TestingModule;

  let service: ImoveisService;

  let imoveisRepository: Repository<Imovel>;
  let medidoresRepository: Repository<Medidor>;
  let leiturasRepository: Repository<Leitura>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestesModule, ImoveisModule],
    }).compile();

    service = module.get<ImoveisService>(ImoveisService);
    imoveisRepository = module.get<Repository<Imovel>>(
      getRepositoryToken(Imovel),
    );
    medidoresRepository = module.get<Repository<Medidor>>(
      getRepositoryToken(Medidor),
    );
    leiturasRepository = module.get<Repository<Leitura>>(
      getRepositoryToken(Leitura),
    );
  });

  beforeEach(async () => {
    await leiturasRepository.createQueryBuilder().delete().execute();
    await medidoresRepository.createQueryBuilder().delete().execute();
    await imoveisRepository.createQueryBuilder().delete().execute();
  });

  afterAll(async () => {
    await module.close();
  });

  // ====
  // CRUD
  // ====

  describe('crud', () => {
    describe('listarTodos', () => {
      it('deve listar todos os imóveis cadastrados', async () => {
        // ARRANGE
        await imoveisRepository.save([
          imoveisRepository.create({
            nome: 'Imóvel 1',
            endereco: 'Endereço 1',
          }),
          imoveisRepository.create({
            nome: 'Imóvel 2',
            endereco: 'Endereço 2',
          }),
          imoveisRepository.create({
            nome: 'Imóvel 3',
            endereco: 'Endereço 3',
          }),
          imoveisRepository.create({
            nome: 'Imóvel 4',
            endereco: 'Endereço 4',
          }),
        ]);

        // ACT
        const resultado = await service.listarTodos();

        // ASSERT
        expect(resultado).toHaveLength(4);

        const nomes = resultado.map((imovel) => imovel.nome);

        expect(nomes).toContain('Imóvel 1');
        expect(nomes).toContain('Imóvel 2');
        expect(nomes).toContain('Imóvel 3');
        expect(nomes).toContain('Imóvel 4');
      });
    });

    describe('buscarPorId', () => {
      it('deve buscar no banco o imóvel correspondente ao ID informado', async () => {
        // ARRANGE
        const imovelCriado = imoveisRepository.create({
          nome: 'Apartamento 101',
          endereco: 'Rua dos Testes, 123',
        });
        const imovelSalvo = await imoveisRepository.save(imovelCriado);

        // ACT
        const resultado = await service.buscarPorId(imovelSalvo.id);

        // ASSERT
        expect(resultado.id).toBe(imovelSalvo.id);
        expect(resultado.nome).toBe('Apartamento 101');
        expect(resultado.endereco).toBe('Rua dos Testes, 123');
      });

      it('deve retornar um NotFoundException quando o id não existir', async () => {
        // ARRANGE
        const idInexistente = '00000000-0000-0000-0000-000000000000';

        // ACT + ASSERT
        await expect(service.buscarPorId(idInexistente)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('criar', () => {
      it('deve criar e persistir no banco de dados um registro válido de imóvel', async () => {
        // ARRANGE
        const dados = {
          nome: 'CasaAntiga',
          endereco: 'Avenida Nova Recife',
        };

        // ACT
        const imovelCriado = await service.criar(dados);

        // ASSERT
        expect(imovelCriado.id).toBeDefined();
        expect(imovelCriado.nome).toBe(dados.nome);
        expect(imovelCriado.endereco).toBe(dados.endereco);

        const imovelPersistido = await imoveisRepository.findOne({
          where: { id: imovelCriado.id },
        });

        expect(imovelPersistido).not.toBeNull();
        expect(imovelPersistido?.nome).toBe('CasaAntiga');
        expect(imovelPersistido?.endereco).toBe('Avenida Nova Recife');
      });

      it('deve lançar BadRequestException ao criar imóvel com dados inválidos', async () => {
        // ARRANGE
        const imovelSemNome = { nome: '', endereco: 'Rua Sem Nome' };
        const imovelSemEndereco = { nome: 'Casa sem endereco', endereco: '' };
        const imovelComEspacos = { nome: '   ', endereco: '      ' };

        // ACT + ASSERT
        await expect(service.criar(imovelSemNome)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.criar(imovelSemEndereco)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.criar(imovelComEspacos)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('atualizar', () => {
      it('deve atualizar completamente um registro no banco de dados', async () => {
        // ARRANGE
        const imovelAtual = imoveisRepository.create({
          nome: 'Imovel Atual',
          endereco: 'Endereco Atual',
        });

        const imovelPersistido = await imoveisRepository.save(imovelAtual);

        const imovelComModificacoes = {
          nome: 'Nome Atualizado',
          endereco: 'Endereço Atualizado',
        };

        // ACT
        const imovelAtualizado = await service.atualizar(
          imovelPersistido.id,
          imovelComModificacoes,
        );

        // ASSERT
        expect(imovelAtualizado.id).toBe(imovelPersistido.id);
        expect(imovelAtualizado.nome).toBe('Nome Atualizado');
        expect(imovelAtualizado.endereco).toBe('Endereço Atualizado');

        const imovelNoBanco = await imoveisRepository.findOne({
          where: { id: imovelPersistido.id },
        });

        expect(imovelNoBanco).not.toBeNull();
        expect(imovelNoBanco?.nome).toBe('Nome Atualizado');
        expect(imovelNoBanco?.endereco).toBe('Endereço Atualizado');
      });

      it('deve atualizar parcialmente um registro no banco de dados', async () => {
        // ARRANGE
        const imovelAtual = imoveisRepository.create({
          nome: 'Imovel Atual',
          endereco: 'Endereco Atual',
        });

        const imovelPersistido = await imoveisRepository.save(imovelAtual);

        const imovelParcialNome = {
          nome: 'Nome Parcial Atualizado',
        };

        const imovelParcialEndereco = {
          endereco: 'Endereco Parcial Atualizado',
        };

        // ACT (imovelParcialNome)
        const imovelAtualizadoNome = await service.atualizar(
          imovelPersistido.id,
          imovelParcialNome,
        );

        // ASSERT (imovelParcialNome)
        expect(imovelPersistido.id).toBe(imovelAtualizadoNome.id);
        expect(imovelAtualizadoNome.nome).toBe('Nome Parcial Atualizado');
        expect(imovelAtualizadoNome.endereco).toBe('Endereco Atual');

        // ACT (imovelParcialEndereco)
        const imovelAtualizadoEndereco = await service.atualizar(
          imovelPersistido.id,
          imovelParcialEndereco,
        );

        // ASSERT (imovelParcialEndereco)
        expect(imovelPersistido.id).toBe(imovelAtualizadoEndereco.id);
        expect(imovelAtualizadoEndereco.nome).toBe('Nome Parcial Atualizado');
        expect(imovelAtualizadoEndereco.endereco).toBe(
          'Endereco Parcial Atualizado',
        );
      });

      it('deve disparar BadRequestException quando um campo vazio ou com espaços for passado', async () => {
        // ARRANGE
        const imovelAtual = imoveisRepository.create({
          nome: 'Imovel Atual',
          endereco: 'Endereco Atual',
        });

        const imovelPersistido = await imoveisRepository.save(imovelAtual);

        const nomeVazio = {
          nome: '     ',
        };
        const enderecoVazio = {
          endereco: '     ',
        };

        // ACT + ASSERT
        await expect(
          service.atualizar(imovelPersistido.id, nomeVazio),
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.atualizar(imovelPersistido.id, enderecoVazio),
        ).rejects.toThrow(BadRequestException);
      });

      it('deve disparar NotFoundException quando o id do imóvel não for encontrado', async () => {
        // ARRANGE
        const imovelComModificacoes = {
          nome: 'Imovel Atualizado',
          endereco: 'Endereco Atualizado',
        };
        const idInexistente = '00000000-0000-0000-0000-000000000000';

        // ACT + ASSERT
        await expect(
          service.atualizar(idInexistente, imovelComModificacoes),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('deletar', () => {
      it('deve deletar um imóvel existente no bando de dados', async () => {
        // ARRANGE
        const registroValido = imoveisRepository.create({
          nome: 'Nome Válido',
          endereco: 'Endereco Válido',
        });

        const registroPersistido = await imoveisRepository.save(registroValido);

        // ACT
        await service.deletar(registroPersistido.id);

        //ASSERT
        const imovelDeletado = await imoveisRepository.findOne({
          where: { id: registroPersistido.id },
        });

        expect(imovelDeletado).toBeNull();
      });

      it('deve disparar um NotFoundException quando o id do imóvel não for encontrado', async () => {
        // ARRANGE
        const idInexistente = '00000000-0000-0000-0000-000000000000';

        // ACT + ASSERT
        await expect(service.deletar(idInexistente)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  // =========
  // Dashboard
  // =========

  describe('dashboard', () => {
    describe('contar', () => {
      it('deve mostrar a quantidade de imóveis cadastrados no banco de dados', async () => {
        // ARRANGE
        await imoveisRepository.save([
          imoveisRepository.create({
            nome: 'Imóvel 1',
            endereco: 'Endereço 1',
          }),
          imoveisRepository.create({
            nome: 'Imóvel 2',
            endereco: 'Endereço 2',
          }),
          imoveisRepository.create({
            nome: 'Imóvel 3',
            endereco: 'Endereço 3',
          }),
          imoveisRepository.create({
            nome: 'Imóvel 4',
            endereco: 'Endereço 4',
          }),
        ]);
        const quantidadeEsperada = 4;

        // ACT
        const quantidade = await service.contar();

        // ASSERT
        expect(quantidade).toBe(quantidadeEsperada);
      });
    });
  });
});
