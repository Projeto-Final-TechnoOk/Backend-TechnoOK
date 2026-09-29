import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

import { LoginDto } from './dtos/login.dto';
import { LoginResposta } from './types/login-resposta.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // =====
  // Login
  // =====

  // Valida as credenciais do usuário e retorna um token JWT.
  @Post('login')
  @Public()
  login(
    @Body()
    credenciais: LoginDto,
  ): Promise<LoginResposta> {
    return this.authService.login(credenciais);
  }
}
