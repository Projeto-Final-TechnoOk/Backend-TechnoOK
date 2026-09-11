import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leitura } from '../leituras/leitura.entity';

type Nivel = 'ano' | 'mes' | 'dia';

@Injectable()
export class ConsumoService {
  constructor(
    @InjectRepository(Leitura)
    private leituraRepository: Repository<Leitura>,
  ) {}

  async calcular(medidorId: string, nivel: Nivel, ano?: number, mes?: number) {
    if (ano !== undefined && (!Number.isInteger(ano) || ano < 0)) {
      throw new BadRequestException(
        'O ano informado deve ser um número inteiro e positivo.',
      );
    }

    if (mes !== undefined && (!Number.isInteger(mes) || mes < 1 || mes > 12)) {
      throw new BadRequestException(
        'O mes informado deve ser um número inteiro entre 1 e 12.',
      );
    }

    const leituras = await this.leituraRepository.find({
      where: { medidor: { id: medidorId } },
      order: { dataHora: 'ASC' },
    }); // Lista de leituras de um medidor X ordenadas da mais antiga para a mais nova (crescente)

    const listaConsumos = leituras.slice(1).map((atual, i) => ({
      dataHora: atual.dataHora,
      consumo: Number(atual.valor) - Number(leituras[i].valor),
    })); // cria o "array" "leituras.slice(1)", que é uma cópia de 'leituras' a partir do 2º elemento. "leituras.slice(1)"" = leituras excluindo leituras[0]
    //      Ou seja, o elemento  "leituras.slice(1)"[X] tem o mesmo valor de leituras[X + 1], logo o "leituras.slice(1)" está sempre "uma leitura a frente".
    //      O map monta o array com cada elemento sendo formatado para {dataHora: X, consumo: X}
    //      Consumo é calculado a partir do valor de leitura do elemento atual de "leituras.slice(1)" menos o valor do registro anterior ao atual
    //      Lembrando que o índice da leitura X em "leituras.slice(1)"  representa exatamente a leitura anterior em leituras

    if (nivel === 'ano') {
      return this.agrupar(listaConsumos, (consumo) =>
        consumo.dataHora.getFullYear(),
      );
    } // Identifica que o período analisado deve ser por ano
    //   Passa como parâmetro uma função que vai extrair os anos como chaves para o Map de agrupar.

    if (nivel === 'mes' && !ano) {
      throw new BadRequestException(
        "O deve existir um ano informado para o nível 'mes'.",
      );
    }

    if (nivel === 'mes' && ano) {
      const doAno = listaConsumos.filter(
        (consumo) => consumo.dataHora.getFullYear() === ano,
      ); // Cria uma lista filtrada com consumos somente do ano desejado.
      return this.agrupar(doAno, (consumo) => consumo.dataHora.getMonth() + 1);
    } // Identifica que o período analisado deve ser por mês e recebe como parâmetro um ano
    //   Passa como parâmetro uma função que vai extrair os mêses como chaves para o Map de agrupar.

    if (nivel === 'dia' && (!ano || !mes)) {
      throw new BadRequestException(
        "O deve existir um ano e um mês informado para o nível 'dia'.",
      );
    }

    if (nivel === 'dia' && ano && mes) {
      const doMes = listaConsumos.filter(
        (consumo) =>
          consumo.dataHora.getFullYear() === ano &&
          consumo.dataHora.getMonth() + 1 === mes,
      ); // Cria uma lista filtrada com consumos somente do mês e ano desejados
      return this.agrupar(doMes, (consumo) => consumo.dataHora.getDate());
    } // Identifica que o período analisado deve ser por dia e recebe como parâmetro um ano e um mês
    //   Passa como parâmetro uma função que vai extrair os dias como chaves para o Map de agrupar.
    return [];
  }

  // Agrupa e soma o consumo por uma chave (ano, mês ou dia)
  // Retorna no formato { name, value } que os gráficos do frontend esperam.
  private agrupar(
    consumos: { dataHora: Date; consumo: number }[],
    funcao: (consumoCalculado: { dataHora: Date; consumo: number }) => number,
  ) {
    const mapa = new Map<number, number>(); // Estrutura (chave: valor) muito parecida com Dicionários em Python.
    for (const consumoAtual of consumos) {
      const valorTemporal = funcao(consumoAtual); // Valor que vai ser usado como chave para representar o ano, mês ou dia do consumo analisado.
      mapa.set(
        valorTemporal, // Valor da chave do período temporal que está sendo analisado (dia, mes ou ano) extraída do consumo analisado no momento.
        (mapa.get(valorTemporal) || 0) + consumoAtual.consumo, // Consulta o valor da chave passada (caso a chave ainda não exista, retorna 0) e soma ao consumo atual analisado.
      ); // Atualiza o valor da chave com o novo total acumulado
    }
    return Array.from(mapa.entries()).map(([name, value]) => ({
      name: String(name),
      value: Number(value.toFixed(3)),
    }));
    // Essa última parte funciona assim:
    // 1- Transforma as entradas do mapa {[chave, valor], [chave, valor], [chave, valor]...} para um array com "Array.from(mapa.entries())"
    // 2- Transforma os elementos do array que estão atualmente [9, 15] (exemplo) para {name:'9', value:15}
  }
}
