import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { MedidoresService } from './medidores.service';
import { CriarMedidorDto } from './dtos/criar-medidor.dto';
import { AtualizarMedidorDto } from './dtos/atualizar-medidor.dto';

@Controller('medidores')
export class MedidoresController {
  constructor(private readonly medidoresService: MedidoresService) {}

  @Get()
  listarTodos() {
    return this.medidoresService.listarTodos();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.medidoresService.buscarPorId(id);
  }

  @Post()
  criar(@Body() medidorNovo: CriarMedidorDto) {
    return this.medidoresService.criar(medidorNovo);
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() medidorAtualizado: AtualizarMedidorDto,
  ) {
    return this.medidoresService.atualizar(id, medidorAtualizado);
  }

  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.medidoresService.excluir(id);
  }
}
