import { TipoMedidor } from '../enums/tipo-medidor.enum';

export type MedidorDetalhes = {
  id: string;
  identificador: string;
  tipo: TipoMedidor;

  imovel: {
    id: string;
    nome: string;
    endereco: string;
  };

  ultimaLeitura: {
    id: string;
    dataHora: Date;
    valor: number;
  } | null;

  ultimasLeituras: {
    id: string;
    dataHora: Date;
    valor: number;
  }[];
};
