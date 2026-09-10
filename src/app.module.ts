import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImoveisModule } from './imoveis/imoveis.module';
import { MedidoresModule } from './medidor/medidores.module';
import { LeiturasModule } from './leituras/leituras.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        autoLoadEntities: true,
        synchronize: false,

        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),
    ImoveisModule,
    MedidoresModule,
    LeiturasModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
