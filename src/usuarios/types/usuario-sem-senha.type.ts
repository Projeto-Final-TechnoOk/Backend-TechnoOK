import { CargoUsuario } from '../enums/cargo-usuario.enum';

export type UsuarioSemSenha = {
  id: string;
  nome: string;
  email: string;
  cargo: CargoUsuario;
};
