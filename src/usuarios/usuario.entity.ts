import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { CargoUsuario } from './enums/cargo-usuario.enum';

// Modelo utilizado na criação da tabela de usuários e modelo básico de usuário na aplicação.
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nome!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  senha!: string;

  @Column({
    type: 'enum',
    enum: CargoUsuario,
  })
  cargo!: CargoUsuario;
}
