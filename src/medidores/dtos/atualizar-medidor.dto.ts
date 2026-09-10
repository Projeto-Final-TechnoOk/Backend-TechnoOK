import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TipoMedidor } from '../enums/tipo-medidor.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

// DTO usado na atualização de um produto.
export class AtualizarMedidorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  identificador?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(TipoMedidor)
  tipo?: TipoMedidor;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  imovelId?: string;
}
