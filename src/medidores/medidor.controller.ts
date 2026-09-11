import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MedidoresService } from './medidores.service';
import { CriarMedidorDto } from './dtos/criar-medidor.dto';
import { AtualizarMedidorDto } from './dtos/atualizar-medidor.dto';
import { ConsumoService } from '../consumo/consumo.service';
import { ApiQuery } from '@nestjs/swagger';

@Controller('medidores')
export class MedidoresController {
  constructor(
    private readonly medidoresService: MedidoresService,
    private readonly consumoService: ConsumoService,
  ) {}

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

  // ApiQuery é somente para swagger
  @ApiQuery({
    name: 'nivel',
    enum: ['ano', 'mes', 'dia'],
    required: true,
  })
  @ApiQuery({
    name: 'ano',
    required: false,
  })
  @ApiQuery({
    name: 'mes',
    required: false,
  })
  @Get(':id/consumo')
  calcularConsumo(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('nivel') nivel: 'ano' | 'mes' | 'dia',
    @Query('ano') ano?: string,
    @Query('mes') mes?: string,
  ) {
    return this.consumoService.calcular(
      id,
      nivel,
      ano ? Number(ano) : undefined,
      mes ? Number(mes) : undefined,
    );
  }
}
