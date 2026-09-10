import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class CriarLeituraDto {
  @ApiProperty({
    example: '2026-09-10T14:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  dataHora!: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  valor!: number;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  medidorId!: string;
}
