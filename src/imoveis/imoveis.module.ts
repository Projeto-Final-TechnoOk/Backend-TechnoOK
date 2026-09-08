import { Module } from '@nestjs/common';
import { ImoveisController } from './imoveis.controller';
import { ImoveisService } from './imoveis.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Imovel } from './imovel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Imovel])],
  controllers: [ImoveisController],
  providers: [ImoveisService],
})
export class ImoveisModule {}
