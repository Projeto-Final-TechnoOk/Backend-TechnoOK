import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class CriarLeituraDto {
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
