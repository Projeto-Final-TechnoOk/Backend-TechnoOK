import { CargoUsuario } from '../../usuarios/enums/cargo-usuario.enum';

export type LoginResposta = {
  accessToken: string;

  usuario: {
    id: string;
    nome: string;
    email: string;
    cargo: CargoUsuario;
  };
};
