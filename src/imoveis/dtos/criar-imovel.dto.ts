import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CriarImovelDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nome!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  endereco!: string;
}
