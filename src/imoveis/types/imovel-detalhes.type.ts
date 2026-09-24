import { TipoMedidor } from '../../medidores/enums/tipo-medidor.enum';

export type ImovelDetalhes = {
  id: string;
  nome: string;
  endereco: string;

  medidores: {
    id: string;
    identificador: string;
    tipo: TipoMedidor;
  }[];

  ultimaLeitura: {
    dataHora: Date;
    valor: number;
    medidorId: string;
    medidorIdentificador: string;
  } | null;
};
