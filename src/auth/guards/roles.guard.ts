import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { CargoUsuario } from '../../usuarios/enums/cargo-usuario.enum';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  // =====================
  // Validação de Permissão
  // =====================

  canActivate(context: ExecutionContext): boolean {
    // Recupera os cargos definidos através do decorator @Roles().
    const rolesPermitidas = this.reflector.getAllAndOverride<CargoUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Caso a rota não possua @Roles(), nenhuma autorização específica é necessária.
    if (!rolesPermitidas || rolesPermitidas.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{
      usuario?: JwtPayload;
    }>();

    const usuario = request.usuario;

    // O JwtAuthGuard deve executar antes deste guard.
    if (!usuario) {
      throw new ForbiddenException(
        'Usuário sem permissão para acessar este recurso.',
      );
    }

    const possuiPermissao = rolesPermitidas.includes(usuario.cargo);
    if (!possuiPermissao) {
      throw new ForbiddenException(
        'Usuário sem permissão para acessar este recurso.',
      );
    }
    return true;
  }
}
