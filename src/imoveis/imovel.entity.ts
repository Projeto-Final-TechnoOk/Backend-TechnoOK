import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Medidor } from '../medidor/medidor.entity';
@Entity('imoveis')
export class Imovel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nome!: string;

  @Column()
  endereco!: string;

  @OneToMany(() => Medidor, (medidor) => medidor.imovel)
  medidores!: Medidor[];
}
