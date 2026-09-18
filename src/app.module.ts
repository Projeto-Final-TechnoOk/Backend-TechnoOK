import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImoveisModule } from './imoveis/imoveis.module';
import { MedidoresModule } from './medidores/medidores.module';
import { LeiturasModule } from './leituras/leituras.module';
import { ConsumoModule } from './consumo/consumo.module';
import { DashboardModule } from './dashboard/dashboard.module';

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
        charset: 'utf8mb4',
        autoLoadEntities: true,
        synchronize: false,

        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),
    ImoveisModule,
    MedidoresModule,
    LeiturasModule,
    ConsumoModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
