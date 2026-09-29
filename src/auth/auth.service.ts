import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';

import { UsuariosService } from '../usuarios/usuarios.service';

import { LoginDto } from './dtos/login.dto';
import { LoginResposta } from './types/login-resposta.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  // =====
  // Login
  // =====

  // Valida as credenciais do usuário e gera um token JWT caso estejam corretas.
  async login(credenciais: LoginDto): Promise<LoginResposta> {
    const usuario = await this.usuariosService.buscarPorEmail(
      credenciais.email,
    );
    // Utilizamos a mesma mensagem para e-mail inexistente e senha incorreta para não informar qual dado está errado.
    if (!usuario) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const senhaValida: boolean = await compare(
      credenciais.senha,
      usuario.senha,
    );
    if (!senhaValida) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      cargo: usuario.cargo,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
      },
    };
  }
}
