import { TipoMedidor } from '../../medidores/enums/tipo-medidor.enum';
import { PeriodoConsumo } from '../enums/periodo-consumo.enum';

export type ConsumoImovel = {
  tipo: TipoMedidor;
  periodo: PeriodoConsumo;
  unidade: string;

  intervalos: {
    inicio: Date;
    fim: Date;
    rotulo: string;
  }[];

  medidores: {
    id: string;
    identificador: string;
    consumos: number[];
  }[];
};
