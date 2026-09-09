import { TipoMedidor } from '../enums/tipo-medidor.enum';

export type MedidorListagem = {
  id: string;
  identificador: string;
  tipo: TipoMedidor;
  imovelId: string;
  imovelNome: string;
};
