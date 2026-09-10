import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Medidor } from '../medidor/medidor.entity';

@Entity('leituras')
export class Leitura {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'datetime', name: 'data_hora' })
  dataHora!: Date;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
  })
  valor!: number;

  @ManyToOne(() => Medidor, (medidor) => medidor.leituras, { nullable: false })
  @JoinColumn({ name: 'medidor_id' })
  medidor!: Medidor;
}
