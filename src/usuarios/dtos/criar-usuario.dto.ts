import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { CargoUsuario } from '../enums/cargo-usuario.enum';

// DTO usado na criação de um usuário.
export class CriarUsuarioDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  senha!: string;

  @ApiProperty({
    enum: CargoUsuario,
  })
  @IsEnum(CargoUsuario)
  cargo!: CargoUsuario;
}
