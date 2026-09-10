import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Imovel } from '../imoveis/imovel.entity';
import { TipoMedidor } from './enums/tipo-medidor.enum';
import { Leitura } from '../leituras/leitura.entity';

// Modelo utilizado na criação da tabela de medidores e modelo básico de medidor na aplicação.
@Entity('medidores')
export class Medidor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  identificador!: string;

  @Column({ type: 'enum', enum: TipoMedidor })
  tipo!: TipoMedidor;

  // Lado N da relação N-1
  @ManyToOne(() => Imovel, (imovel) => imovel.medidores, {
    nullable: false,
    onDelete: 'RESTRICT', // Não permite a deleção de um imóvel caso um imóvel tenha algum medidor associado
  })
  @JoinColumn({ name: 'imovel_id' })
  imovel!: Imovel;

  // Lado 1 da relação N-1
  @OneToMany(() => Leitura, (leitura) => leitura.medidor)
  leituras!: Leitura[];
}
