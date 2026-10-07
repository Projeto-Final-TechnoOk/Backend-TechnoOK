import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import type { Server } from 'http';

import { TestesModule } from '../../config/testes.module';

import { ImoveisModule } from '../../../src/imoveis/imoveis.module';

import { Imovel } from '../../../src/imoveis/imovel.entity';
import { Medidor } from '../../../src/medidores/medidor.entity';
import { Leitura } from '../../../src/leituras/leitura.entity';

type ImovelResponse = {
  id: string;
  nome: string;
  endereco: string;
};

describe('ImoveisController - Integração', () => {
  let app: INestApplication;
  let httpServer: Server;

  let imoveisRepository: Repository<Imovel>;
  let medidoresRepository: Repository<Medidor>;
  let leiturasRepository: Repository<Leitura>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestesModule, ImoveisModule],
    }).compile();

    app = module.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    httpServer = app.getHttpServer() as Server;

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
    await app.close();
  });

  // ====
  // CRUD
  // ====

  describe('crud', () => {
    describe('GET /imoveis/:id', () => {
      it('Deve retornar 200 e um imóvel existente', async () => {
        // ARRANGE
        const imovel = imoveisRepository.create({
          nome: 'Apartamento 101',
          endereco: 'Rua dos Testes, 123',
        });

        const imovelPersistido = await imoveisRepository.save(imovel);

        // ACT
        const resposta = await request(httpServer)
          .get(`/imoveis/${imovelPersistido.id}`)
          .expect(200);

        // ASSERT
        const body = resposta.body as ImovelResponse;

        expect(body.id).toBe(imovelPersistido.id);
        expect(body.nome).toBe('Apartamento 101');
        expect(body.endereco).toBe('Rua dos Testes, 123');
      });

      it('Deve retornar 404 ao tentar buscar um imóvel inexistente', async () => {
        // ARRANGE
        const idInexistente = '00000000-0000-0000-0000-000000000000';

        // ACT + ASSERT
        await request(httpServer).get(`/imoveis/${idInexistente}`).expect(404);
      });

      it('Deve retornar 400 ao passar um id com formato inválido', async () => {
        // ARRANGE
        const idInvalido = '12345';

        // ACT + ASSERT
        await request(httpServer).get(`/imoveis/${idInvalido}`).expect(400);
      });
    });

    describe('GET /imoveis', () => {
      it('Deve retornar 200 e todos os imóveis cadastrados', async () => {
        // ARRANGE
        await imoveisRepository.save([
          imoveisRepository.create({
            nome: 'Imóvel teste 1',
            endereco: 'Endereço teste 1',
          }),
          imoveisRepository.create({
            nome: 'Imóvel teste 2',
            endereco: 'Endereço teste 2',
          }),
          imoveisRepository.create({
            nome: 'Imóvel teste 3',
            endereco: 'Endereço teste 3',
          }),
          imoveisRepository.create({
            nome: 'Imóvel teste 4',
            endereco: 'Endereço teste 4',
          }),
        ]);

        // ACT
        const resultados = await request(httpServer)
          .get('/imoveis')
          .expect(200);

        // ASSERT
        const body = resultados.body as ImovelResponse[];
        const nomes = body.map((imovel) => imovel.nome);
        expect(body).toHaveLength(4);
        expect(nomes).toContain('Imóvel teste 1');
        expect(nomes).toContain('Imóvel teste 2');
        expect(nomes).toContain('Imóvel teste 3');
        expect(nomes).toContain('Imóvel teste 4');
      });

      it('Deve retornar 200 e uma lista vazia quando não existem imóveis cadastrados', async () => {
        // ARRANGE
        // Banco de dados já está vazio.

        // ACT
        const resultados = await request(httpServer)
          .get('/imoveis')
          .expect(200);

        // ASSERT
        const body = resultados.body as ImovelResponse[];

        expect(body).toEqual([]);
        expect(body).toHaveLength(0);
      });
    });

    describe('POST /imoveis', () => {
      it('Deve retornar 201, criar um imóvel e persistir o registro no banco de dados', async () => {
        // ARRANGE
        const novoImovel = {
          nome: 'Nome do Novo Imóvel',
          endereco: 'Endereço do Novo Imóvel',
        };

        // ACT
        const resposta = await request(httpServer)
          .post('/imoveis')
          .send(novoImovel)
          .expect(201);

        // ASSERT
        const body = resposta.body as ImovelResponse;
        expect(body.id).toBeDefined();
        expect(body.nome).toBe('Nome do Novo Imóvel');
        expect(body.endereco).toBe('Endereço do Novo Imóvel');

        const imovelRegistrado = await imoveisRepository.findOne({
          where: { id: body.id },
        });
        expect(imovelRegistrado).not.toBeNull();
        expect(imovelRegistrado?.nome).toBe('Nome do Novo Imóvel');
        expect(imovelRegistrado?.endereco).toBe('Endereço do Novo Imóvel');
      });

      it('Deve retornar 400 ao tentar criar um imóvel incompleto', async () => {
        // ARRANGE
        const novoImovelIncompleto = {
          nome: 'Nome do imóvel incompleto',
        };

        // ACT
        await request(httpServer)
          .post('/imoveis')
          .send(novoImovelIncompleto)
          .expect(400);

        // ASSERT
        const noBanco = await imoveisRepository.findOne({
          where: { nome: novoImovelIncompleto.nome },
        });

        expect(noBanco).toBeNull();
      });

      it('Deve retornar 400 ao tentar criar um imóvel com nome vazio', async () => {
        // ARRANGE
        const novoImovelVazio = {
          nome: '      ',
          endereco: 'Endereço do Imóvel sem Nome',
        };

        // ACT
        await request(httpServer)
          .post('/imoveis')
          .send(novoImovelVazio)
          .expect(400);

        // ASSERT
        const noBanco = await imoveisRepository.findOne({
          where: { nome: novoImovelVazio.nome },
        });

        expect(noBanco).toBeNull();
      });

      it('Deve retornar 400 ao tentar criar um imóvel com endereço vazio', async () => {
        // ARRANGE
        const novoImovelVazio = {
          nome: 'Imóvel sem endereço',
          endereco: '     ',
        };

        // ACT
        await request(httpServer)
          .post('/imoveis')
          .send(novoImovelVazio)
          .expect(400);

        // ASSERT
        const noBanco = await imoveisRepository.findOne({
          where: { nome: novoImovelVazio.nome },
        });

        expect(noBanco).toBeNull();
      });
    });

    describe('DELETE /imoveis', () => {
      it('Deve retornar 200 e encontrar e deletar o imóvel referente ao id informado', async () => {
        // ARRANGE
        const imovel = {
          nome: 'Nome do imóvel a ser deletado',
          endereco: 'Endereço do imóvel a ser deletado',
        };

        const imovelPersistido = await imoveisRepository.save(
          imoveisRepository.create(imovel),
        );

        // ACT
        await request(httpServer)
          .delete(`/imoveis/${imovelPersistido.id}`)
          .expect(200);

        // ASSERT
        const imovelNoBanco = await imoveisRepository.findOne({
          where: { id: imovelPersistido.id },
        });

        expect(imovelNoBanco).toBeNull();
      });

      it('Deve retornar 404 ao tentar deletar um imóvel inexistente', async () => {
        // Arrange
        // Banco de dados já está vazio
        const idInexistente = '00000000-0000-0000-0000-000000000000';

        // ACT + ASSERT
        await request(httpServer)
          .delete(`/imoveis/${idInexistente}`)
          .expect(404);
      });

      it('Deve retornar 400 ao tentar deletar um imóvel com id vazio', async () => {
        // Arrange
        // Banco de dados já está vazio
        const idInexistente = '           ';

        // ACT + ASSERT
        await request(httpServer)
          .delete(`/imoveis/${idInexistente}`)
          .expect(404);
      });
    });

    describe('PATCH /imoveis', () => {
      it('Deve retornar 200 e atualizar um registro de imóvel existente', async () => {
        // ARRANGE
        const imovelExistente = {
          nome: 'Nome existente',
          endereco: 'Endereço existente',
        };

        const imovelPersistido = await imoveisRepository.save(
          imoveisRepository.create(imovelExistente),
        );

        const imovelComAlteracoes = {
          nome: 'Nome alterado',
          endereco: 'Endereço alterado',
        };

        // ACT
        const resposta = await request(httpServer)
          .patch(`/imoveis/${imovelPersistido.id}`)
          .send(imovelComAlteracoes)
          .expect(200);

        // ASSERT
        const body = resposta.body as ImovelResponse;

        expect(body.id).toBe(imovelPersistido.id);
        expect(body.nome).toBe('Nome alterado');
        expect(body.endereco).toBe('Endereço alterado');

        const imovelNoBanco = await imoveisRepository.findOne({
          where: { id: body.id },
        });

        expect(imovelNoBanco).not.toBeNull();
        expect(imovelNoBanco?.nome).toBe('Nome alterado');
        expect(imovelNoBanco?.endereco).toBe('Endereço alterado');
      });

      it('Deve retornar 200 e atualizar parcialmente o registro de imóvel correspondente no banco', async () => {
        // ARRANGE
        const imovelExistente = {
          nome: 'Nome Imóvel Existente',
          endereco: 'Endereço Imóvel Existente',
        };

        const imovelPersistido = await imoveisRepository.save(
          imoveisRepository.create(imovelExistente),
        );

        const imovelNomeModificado = {
          nome: 'Nome Imóvel Alterado',
        };

        // ACT
        const resultado = await request(httpServer)
          .patch(`/imoveis/${imovelPersistido.id}`)
          .send(imovelNomeModificado)
          .expect(200);

        // ASSERT
        const resposta = resultado.body as ImovelResponse;
        expect(resposta.id).toBe(imovelPersistido.id);
        expect(resposta.nome).toBe('Nome Imóvel Alterado');
        expect(resposta.endereco).toBe('Endereço Imóvel Existente');

        const imovelNoBanco = await imoveisRepository.findOne({
          where: { id: resposta.id },
        });
        expect(imovelNoBanco).not.toBeNull();
        expect(imovelNoBanco?.id).toBe(imovelPersistido.id);
        expect(imovelNoBanco?.nome).toBe('Nome Imóvel Alterado');
        expect(imovelNoBanco?.endereco).toBe('Endereço Imóvel Existente');
      });

      it('Deve retornar 400 ao tentar atualizar um imóvel com campos inválidos', async () => {
        // ARRANGE
        const imovelExistente = {
          nome: 'Nome Imóvel Existente',
          endereco: 'Endereço Imóvel Existente',
        };

        const imovelPersistido = await imoveisRepository.save(
          imoveisRepository.create(imovelExistente),
        );

        const imovelInvalido = {
          nome: '            ',
          endereco: '  ',
        };

        // ACT
        await request(httpServer)
          .patch(`/imoveis/${imovelPersistido.id}`)
          .send(imovelInvalido)
          .expect(400);

        // ASSERT
        const imovelNoBanco = await imoveisRepository.findOne({
          where: { id: imovelPersistido.id },
        });

        expect(imovelNoBanco).not.toBeNull();
        expect(imovelNoBanco?.nome).toBe('Nome Imóvel Existente');
        expect(imovelNoBanco?.endereco).toBe('Endereço Imóvel Existente');
      });

      it('Deve retornar 404 ao tentar alterar um imóvel inexistente', async () => {
        // ARRANGE
        // Banco de dados vazio

        const imovelComModificacoes = {
          nome: 'Nome do imóvel modificado',
          endereco: 'Endereco do imóvel modificado',
        };

        const idInexistente = '00000000-0000-0000-0000-000000000000';

        // ACT + ASSERT
        await request(httpServer)
          .patch(`/imoveis/${idInexistente}`)
          .send(imovelComModificacoes)
          .expect(404);
      });
    });
  });

  // =========
  // Dashboard
  // =========

  describe('dashboard', () => {
    describe('GET imoveis/contar', () => {
      it('Deve receber 200 e a quantidade de registros de imóveis cadastrados', async () => {
        // ARRANGE
        const imoveis = [
          { nome: 'Imovel 1', endereco: 'Imovel 1' },
          { nome: 'Imovel 2', endereco: 'Imovel 2' },
          { nome: 'Imovel 3', endereco: 'Imovel 3' },
          { nome: 'Imovel 4', endereco: 'Imovel 4' },
          { nome: 'Imovel 5', endereco: 'Imovel 5' },
        ];

        await imoveisRepository.save(
          imoveis.map((imovel) => imoveisRepository.create(imovel)),
        );

        // ACT
        const resposta = await request(httpServer)
          .get('/imoveis/contar')
          .expect(200);

        // ASSERT
        expect(Number(resposta.text)).toBe(5);
      });
    });
  });
});
