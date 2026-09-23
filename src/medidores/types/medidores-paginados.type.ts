import { MedidorListagem } from './medidor-listagem.type';

export type MedidoresPaginados = {
  dados: MedidorListagem[];
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};
