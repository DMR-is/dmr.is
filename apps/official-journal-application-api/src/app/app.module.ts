import { DMRSequelizeConfigModule, DMRSequelizeConfigService } from '@dmr.is/db'
import { LoggingModule } from '@dmr.is/logging'
import {
  AdvertTypeController,
  AdvertTypeModule,
  ApplicationModule,
  HealthModule,
  PdfModule,
  SignatureModule,
  UserModule,
  UtilityModule,
} from '@dmr.is/modules'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'

import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationController } from './application/application.controller'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [
        DMRSequelizeConfigModule.register({
          database: process.env.DB_NAME || 'dev_db_official_journal',
          host: process.env.DB_HOST || 'localhost',
          password: process.env.DB_PASSWORD || 'dev_db',
          username: process.env.DB_USERNAME || 'dev_db',
          port: Number(process.env.DB_PORT) || 5433,
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    LoggingModule,
    ApplicationModule,
    SignatureModule,
    HealthModule,
    PdfModule,
    UtilityModule,
    AdvertTypeModule,
    UserModule,
  ],
  controllers: [ApplicationController, AdvertTypeController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
