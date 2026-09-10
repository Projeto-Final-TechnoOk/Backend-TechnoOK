import { Leitura } from '../leitura.entity';
import { LeituraListagem } from '../types/leitura-listagem.type';

export class LeiturasMapper {
  static entityParaListagem(leitura: Leitura): LeituraListagem {
    return {
      id: leitura.id,
      dataHora: leitura.dataHora,
      valor: leitura.valor,
      medidorId: leitura.medidor.id,
      medidorIdentificador: leitura.medidor.identificador,
    };
  }
}
