import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ImoveisService } from './imoveis.service';
import { CriarImovelDto } from './dtos/criar-imovel.dto';
import { AtualizarImovelDto } from './dtos/atualizar-imovel.dto';
import { TipoMedidor } from '../medidores/enums/tipo-medidor.enum';
import { PeriodoConsumo } from './enums/periodo-consumo.enum';

@Controller('imoveis')
export class ImoveisController {
  constructor(private readonly imoveisService: ImoveisService) {}

  @Get()
  listarTodos() {
    return this.imoveisService.listarTodos();
  }

  @Get('paginado')
  listarPaginado(
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe)
    pagina: number,

    @Query('limite', new DefaultValuePipe(5), ParseIntPipe)
    limite: number,
  ) {
    return this.imoveisService.listarPaginado(pagina, limite);
  }

  @Get('contar')
  contar() {
    return this.imoveisService.contar();
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.imoveisService.buscarPorId(id);
  }

  @Get(':id/medidores')
  buscarComMedidores(@Param('id', ParseUUIDPipe) id: string) {
    return this.imoveisService.buscarComMedidores(id);
  }

  @Get(':id/detalhes')
  buscarComDetalhes(@Param('id', ParseUUIDPipe) id: string) {
    return this.imoveisService.buscarComDetalhes(id);
  }

  @Get(':id/consumo')
  buscarConsumo(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Query('tipo', new ParseEnumPipe(TipoMedidor))
    tipo: TipoMedidor,

    @Query('periodo', new ParseEnumPipe(PeriodoConsumo))
    periodo: PeriodoConsumo,
  ) {
    return this.imoveisService.buscarConsumo(id, tipo, periodo);
  }

  @Post()
  criar(@Body() imovelNovo: CriarImovelDto) {
    return this.imoveisService.criar(imovelNovo);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() imovelAtualizado: AtualizarImovelDto,
  ) {
    return this.imoveisService.atualizar(id, imovelAtualizado);
  }

  @Delete(':id')
  deletar(@Param('id', ParseUUIDPipe) id: string) {
    return this.imoveisService.deletar(id);
  }
}
