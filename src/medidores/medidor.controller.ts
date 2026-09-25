import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
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
import { PeriodoConsumo } from '../imoveis/enums/periodo-consumo.enum';

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

  @Get('paginado')
  listarPaginado(
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
    @Query('limite', new DefaultValuePipe(50), ParseIntPipe) limite: number,
  ) {
    return this.medidoresService.listarPaginado(pagina, limite);
  }

  @Get('contar')
  contar() {
    return this.medidoresService.contar();
  }

  // Busca somente um medidor (carrega também todas as informações do imóvel).
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.medidoresService.buscarPorId(id);
  }

  @Get(':id/detalhes')
  buscarComDetalhes(@Param('id', ParseUUIDPipe) id: string) {
    return this.medidoresService.buscarComDetalhes(id);
  }

  @Get(':id/comparacao')
  buscarComparacaoConsumo(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Query('periodo', new ParseEnumPipe(PeriodoConsumo))
    periodo: PeriodoConsumo,
  ) {
    return this.medidoresService.buscarComparacaoConsumo(id, periodo);
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
