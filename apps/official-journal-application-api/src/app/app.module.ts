import { LoggingModule } from '@dmr.is/logging'
import { OFFICIAL_JOURNAL_DB } from '@dmr.is/official-journal/models'
import {
  AdvertTypeController,
  AdvertTypeModule,
} from '@dmr.is/official-journal/modules/advert-type'
import { PdfModule } from '@dmr.is/official-journal/modules/pdf'
import { SignatureModule } from '@dmr.is/official-journal/modules/signature'
import { UserModule } from '@dmr.is/official-journal/modules/user'
import { UtilityModule } from '@dmr.is/official-journal/modules/utility'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'
import { HealthModule } from '@dmr.is/shared/modules/health'
import {
  DMRSequelizeConfigModule,
  DMRSequelizeConfigService,
} from '@dmr.is/shared/modules/sequelize'

import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationController } from './application/application.controller'
import { OfficialJournalApplicationService } from './application/application.service'
import { IOfficialJournalApplicationService } from './application/application.service.interface'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [
        DMRSequelizeConfigModule.register({
          database: process.env.DB_NAME || 'dev_db_official_journal',
          host: process.env.DB_HOST || 'localhost',
          password: process.env.DB_PASS || 'dev_db',
          username: process.env.DB_USER || 'dev_db',
          port: Number(process.env.DB_PORT) || 5433,
          models: [...OFFICIAL_JOURNAL_DB],
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    LoggingModule,
    SignatureModule,
    PdfModule,
    UtilityModule,
    AdvertTypeModule,
    UserModule,
    HealthModule,
  ],
  controllers: [ApplicationController, AdvertTypeController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: IOfficialJournalApplicationService,
      useClass: OfficialJournalApplicationService,
    },
  ],
})
export class AppModule {}
