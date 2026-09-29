import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { JwtService } from '@nestjs/jwt';
import { PUBLIC_KEY } from '../decorators/public.decorator';

import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,

    private readonly reflector: Reflector,
  ) {}

  // ====================
  // Validação do Token
  // ====================

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verifica se a rota foi marcada explicitamente como pública.
    const rotaPublica = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (rotaPublica) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: {
        authorization?: string;
      };
      usuario?: JwtPayload;
    }>();

    const token = this.extrairToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Token de autenticação não informado.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.usuario = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }

  // ===================
  // Funções Auxiliares
  // ===================

  private extrairToken(authorization?: string): string | null {
    if (!authorization) {
      return null;
    }
    const [tipo, token] = authorization.split(' ');
    if (tipo !== 'Bearer' || !token) {
      return null;
    }
    return token;
  }
}
