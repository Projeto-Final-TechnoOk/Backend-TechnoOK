import { TipoMedidor } from '../enums/tipo-medidor.enum';
import { PeriodoConsumo } from '../../imoveis/enums/periodo-consumo.enum';

export type ComparacaoConsumoMedidor = {
  tipo: TipoMedidor;
  periodo: PeriodoConsumo;
  unidade: string;

  mediaOutrosMedidores: number | null;
  quantidadeOutrosMedidores: number;
};
