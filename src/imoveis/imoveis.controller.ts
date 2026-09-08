import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ImoveisService } from './imoveis.service';
import { CriarImovelDto } from './dtos/criar-imovel.dto';
import { AtualizarImovelDto } from './dtos/atualizar-imovel.dto';

@Controller('imoveis')
export class ImoveisController {
  constructor(private readonly imoveisService: ImoveisService) {}

  @Post()
  criar(@Body() imovel: CriarImovelDto) {
    return this.imoveisService.criar(imovel);
  }

  @Get()
  listarTodos() {
    return this.imoveisService.listarTodos();
  }

  @Get(':id')
  encontrarUm(@Param('id') id: string) {
    return this.imoveisService.encontrarUm(id);
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() imovelAtualizado: AtualizarImovelDto,
  ) {
    return this.imoveisService.atualizar(id, imovelAtualizado);
  }

  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.imoveisService.excluir(id);
  }
}
