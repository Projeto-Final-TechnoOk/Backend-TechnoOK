import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { TipoMedidor } from '../enums/tipo-medidor.enum';

//DTO usado na criação de um produto.
export class CriarMedidorDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  identificador!: string;

  @ApiProperty()
  @IsEnum(TipoMedidor)
  tipo!: TipoMedidor;

  @ApiProperty()
  @IsUUID()
  imovelId!: string;
}
