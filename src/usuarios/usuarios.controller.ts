import { Body, Controller, Get, Post } from '@nestjs/common';

import { UsuariosService } from './usuarios.service';

import { CriarUsuarioDto } from './dtos/criar-usuario.dto';
import { CriarPrimeiroAdminDto } from './dtos/criar-primeiro-admin.dto';
import { UsuarioSemSenha } from './types/usuario-sem-senha.type';
import { Roles } from '../auth/decorators/roles.decorator';
import { CargoUsuario } from './enums/cargo-usuario.enum';

import { Public } from '../auth/decorators/public.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // ==========================
  // Primeiro Administrador
  // ==========================

  // Cria o primeiro administrador do sistema.
  @Post('primeiro-admin')
  @Public()
  criarPrimeiroAdmin(
    @Body()
    usuarioNovo: CriarPrimeiroAdminDto,
  ): Promise<UsuarioSemSenha> {
    return this.usuariosService.criarPrimeiroAdmin(usuarioNovo);
  }

  // ==================
  // Criação de Usuário
  // ==================

  // Cria uma nova conta de usuário.
  @Post()
  @Roles(CargoUsuario.ADMIN)
  criar(
    @Body()
    usuarioNovo: CriarUsuarioDto,
  ): Promise<UsuarioSemSenha> {
    return this.usuariosService.criar(usuarioNovo);
  }

  // Verifica se é possível criar o primeiro admin
  @Public()
  @Get('primeiro-admin/disponivel')
  async primeiroAdminDisponivel(): Promise<{ disponivel: boolean }> {
    const disponivel = await this.usuariosService.primeiroAdminDisponivel();

    return {
      disponivel,
    };
  }
}
