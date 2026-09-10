import { Medidor } from '../medidor.entity';
import { MedidorListagem } from '../types/medidor-listagem.type';

export class MedidoresMapper {
  static entityParaListagem(medidor: Medidor): MedidorListagem {
    return {
      id: medidor.id,
      identificador: medidor.identificador,
      tipo: medidor.tipo,
      imovelId: medidor.imovel.id,
      imovelNome: medidor.imovel.nome,
    };
  }
}
