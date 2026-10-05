import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Imovel } from '../../src/imoveis/imovel.entity';
import { Medidor } from '../../src/medidores/medidor.entity';
import { Leitura } from '../../src/leituras/leitura.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.test',
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),

        entities: [Imovel, Medidor, Leitura],

        synchronize: false,
      }),
    }),

    TypeOrmModule.forFeature([Imovel, Medidor, Leitura]),
  ],

  exports: [TypeOrmModule],
})
export class TestesModule {}
