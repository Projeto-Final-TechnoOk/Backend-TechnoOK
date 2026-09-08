import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('imoveis')
export class Imovel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nome!: string;

  @Column()
  endereco!: string;
}
