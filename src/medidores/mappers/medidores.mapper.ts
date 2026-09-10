import { Medidor } from '../medidor.entity';
import { MedidorListagem } from '../types/medidor-listagem.type';

//Vai extrair somente o id e o nome do imóvel para retornar como resposta.
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
