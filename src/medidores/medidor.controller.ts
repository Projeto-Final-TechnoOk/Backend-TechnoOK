import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { MedidoresService } from './medidores.service';
import { CriarMedidorDto } from './dtos/criar-medidor.dto';
import { AtualizarMedidorDto } from './dtos/atualizar-medidor.dto';

@Controller('medidores')
export class MedidoresController {
  constructor(private readonly medidoresService: MedidoresService) {}

  // Lista todos os medidores (cada medidor carrega também o id e o nome do imóvel).
  @Get()
  listarTodos() {
    return this.medidoresService.listarTodos();
  }

  // Busca somente um medidor (carrega também todas as informações do imóvel).
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.medidoresService.buscarPorId(id);
  }

  // Busca somente um medidor (carrega também todas as informações do imóvel e todas as leituras associadas a ele).
  @Get(':id/detalhes')
  buscarComImovelELeituras(@Param('id', ParseUUIDPipe) id: string) {
    return this.medidoresService.buscarComImovelELeituras(id);
  }

  // Cria um novo registro de medidor.
  @Post()
  criar(@Body() medidorNovo: CriarMedidorDto) {
    return this.medidoresService.criar(medidorNovo);
  }

  // Atualiza um registro de medidor.
  @Patch(':id')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() medidorAtualizado: AtualizarMedidorDto,
  ) {
    return this.medidoresService.atualizar(id, medidorAtualizado);
  }

  // Deleta um regitro de medidor e todas as leituras associadas a ele.
  @Delete(':id')
  deletar(@Param('id', ParseUUIDPipe) id: string) {
    return this.medidoresService.deletar(id);
  }
}
