import { Module } from '@nestjs/common';
import { MedidoresController } from './medidor.controller';
import { MedidoresService } from './medidores.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medidor } from './medidor.entity';
import { ImoveisModule } from '../imoveis/imoveis.module';

@Module({
  controllers: [MedidoresController],
  providers: [MedidoresService],
  imports: [TypeOrmModule.forFeature([Medidor]), ImoveisModule],
})
export class MedidoresModule {}
