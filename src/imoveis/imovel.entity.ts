import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import type { Relation } from 'typeorm';

import { Medidor } from '../medidores/medidor.entity';

@Entity('imoveis')
export class Imovel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nome!: string;

  @Column()
  endereco!: string;

  @OneToMany(() => Medidor, (medidor) => medidor.imovel)
  medidores!: Relation<Medidor[]>;
}
