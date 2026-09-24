import { Module } from '@nestjs/common';
import { ImoveisController } from './imoveis.controller';
import { ImoveisService } from './imoveis.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Imovel } from './imovel.entity';
import { Leitura } from '../leituras/leitura.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Imovel, Leitura])],
  controllers: [ImoveisController],
  providers: [ImoveisService],
  exports: [ImoveisService],
})
export class ImoveisModule {}
