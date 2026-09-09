import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Imovel } from '../imoveis/imovel.entity';
import { TipoMedidor } from './enums/tipo-medidor.enum';

@Entity('medidores')
export class Medidor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  identificador!: string;

  @Column({ type: 'enum', enum: TipoMedidor })
  tipo!: TipoMedidor;

  @ManyToOne(() => Imovel, (imovel) => imovel.medidores, { nullable: false })
  @JoinColumn({ name: 'imovel_id' })
  imovel!: Imovel;
}
