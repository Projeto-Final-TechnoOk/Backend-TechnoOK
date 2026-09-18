import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
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
