import { Test, TestingModule } from '@nestjs/testing';
import { LeiturasController } from './leituras.controller';

describe('LeiturasController', () => {
  let controller: LeiturasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeiturasController],
    }).compile();

    controller = module.get<LeiturasController>(LeiturasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
