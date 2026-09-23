import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { LeiturasService } from './leituras.service';
import { CriarLeituraDto } from './dtos/criar-leitura.dto';

@Controller('leituras')
export class LeiturasController {
  constructor(private readonly leiturasService: LeiturasService) {}

  @Get()
  listarTodos() {
    return this.leiturasService.listarTodos();
  }

  @Get('paginado')
  listarPaginado(
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
    @Query('limite', new DefaultValuePipe(50), ParseIntPipe) limite: number,
  ) {
    return this.leiturasService.listarPaginado(pagina, limite);
  }

  @Get('contar')
  contar() {
    return this.leiturasService.contar();
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.leiturasService.buscarPorId(id);
  }

  @Post()
  criar(@Body() novaLeitura: CriarLeituraDto) {
    return this.leiturasService.criar(novaLeitura);
  }
}
