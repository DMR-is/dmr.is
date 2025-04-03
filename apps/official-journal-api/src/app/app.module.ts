import { LoggingModule } from '@dmr.is/logging'
import { OFFICIAL_JOURNAL_DB } from '@dmr.is/official-journal/models'
import { AdvertModule } from '@dmr.is/official-journal/modules/advert'
import { AdvertTypeModule } from '@dmr.is/official-journal/modules/advert-type'
import { CategoryModule } from '@dmr.is/official-journal/modules/category'
import { DepartmentModule } from '@dmr.is/official-journal/modules/department'
import { InstitutionModule } from '@dmr.is/official-journal/modules/institution'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'
import { HealthModule } from '@dmr.is/shared/modules/health'
import {
  DMRSequelizeConfigModule,
  DMRSequelizeConfigService,
} from '@dmr.is/shared/modules/sequelize'

import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { SequelizeModule } from '@nestjs/sequelize'

import { JournalModule } from './journal/journal.module'

@Module({
  imports: [
    LoggingModule,
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
    JournalModule,
    AdvertModule,
    DepartmentModule,
    CategoryModule,
    InstitutionModule,
    AdvertTypeModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
