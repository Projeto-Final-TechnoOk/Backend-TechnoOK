import { Module } from '@nestjs/common';

import { UsuariosModule } from '../usuarios/usuarios.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SecurityModule } from './security.module';

@Module({
  imports: [UsuariosModule, SecurityModule],
  providers: [AuthService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
