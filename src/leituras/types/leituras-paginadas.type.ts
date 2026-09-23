import { LeituraListagem } from './leitura-listagem.type';

export type LeiturasPaginadas = {
  dados: LeituraListagem[];
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};
