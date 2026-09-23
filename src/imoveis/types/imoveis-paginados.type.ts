import { Imovel } from '../imovel.entity';

export type ImoveisPaginados = {
  dados: Imovel[];
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};
