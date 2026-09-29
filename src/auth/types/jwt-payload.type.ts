import { CargoUsuario } from '../../usuarios/enums/cargo-usuario.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  cargo: CargoUsuario;

  iat?: number;
  exp?: number;
};
