import { INestApplication } from '@nestjs/common';
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

  describe('GET /imoveis/:id', () => {
    it('deve retornar um imóvel existente', async () => {
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

    it('deve retornar Not Found ao buscar um imóvel inexistente', async () => {
      // ARRANGE
      const idInexistente = '00000000-0000-0000-0000-000000000000';

      // ACT + ASSERT
      await request(httpServer).get(`/imoveis/${idInexistente}`).expect(404);
    });

    it('deve retornar Bad Request ao passar um id com formato inválido', async () => {
      // ARRANGE
      const idInvalido = '12345';

      // ACT + ASSERT
      await request(httpServer).get(`/imoveis/${idInvalido}`).expect(400);
    });
  });

  describe('GET /imoveis', () => {
    it('deve retornar todos os imóveis cadastrados', async () => {
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
      const resultados = await request(httpServer).get('/imoveis').expect(200);

      // ASSERT
      const body = resultados.body as ImovelResponse[];
      const nomes = body.map((imovel) => imovel.nome);
      expect(body).toHaveLength(4);
      expect(nomes).toContain('Imóvel teste 1');
      expect(nomes).toContain('Imóvel teste 2');
      expect(nomes).toContain('Imóvel teste 3');
      expect(nomes).toContain('Imóvel teste 4');
    });

    it('deve retornar uma lista vazia quando não existem imóceis cadastrados', async () => {
      // ARRANGE
      // Banco de dados já está vazio.

      // ACT
      const resultados = await request(httpServer).get('/imoveis').expect(200);

      // ASSERT
      const body = resultados.body as ImovelResponse[];

      expect(body).toEqual([]);
      expect(body).toHaveLength(0);
    });
  });
});
