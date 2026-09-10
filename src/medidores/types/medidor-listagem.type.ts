import { TipoMedidor } from '../enums/tipo-medidor.enum';

// Tipo usado na listagem gera. Resultado do mapper.
export type MedidorListagem = {
  id: string;
  identificador: string;
  tipo: TipoMedidor;
  imovelId: string;
  imovelNome: string;
};
