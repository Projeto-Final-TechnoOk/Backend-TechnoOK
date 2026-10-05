import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { Imovel } from '../imoveis/imovel.entity';
import { Leitura } from '../leituras/leitura.entity';
import { TipoMedidor } from './enums/tipo-medidor.enum';

@Entity('medidores')
export class Medidor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  identificador!: string;

  @Column({ type: 'enum', enum: TipoMedidor })
  tipo!: TipoMedidor;

  @ManyToOne(() => Imovel, (imovel) => imovel.medidores, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'imovel_id' })
  imovel!: Relation<Imovel>;

  @OneToMany(() => Leitura, (leitura) => leitura.medidor)
  leituras!: Relation<Leitura[]>;
}
