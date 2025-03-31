import { LoggingModule } from '@dmr.is/logging'
import { OFFICIAL_JOURNAL_DB } from '@dmr.is/official-journal/models'
import { AdvertModule } from '@dmr.is/official-journal/modules/advert'
import {
  AdvertTypeAdminController,
  AdvertTypeModule,
} from '@dmr.is/official-journal/modules/advert-type'
import {
  CategoryAdminController,
  CategoryModule,
} from '@dmr.is/official-journal/modules/category'
import { DepartmentModule } from '@dmr.is/official-journal/modules/department'
import {
  InstitutionAdminController,
  InstitutionModule,
} from '@dmr.is/official-journal/modules/institution'
import { PdfModule } from '@dmr.is/official-journal/modules/pdf'
import { UserModule } from '@dmr.is/official-journal/modules/user'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'
import { HealthModule } from '@dmr.is/shared/modules/health'
import {
  DMRSequelizeConfigModule,
  DMRSequelizeConfigService,
} from '@dmr.is/shared/modules/sequelize'

import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModule } from './modules/case/case.module'
import { StatisticsModule } from './modules/statistics/statistics.module'

@Module({
  imports: [
    LoggingModule,
    HealthModule,
    SequelizeModule.forRootAsync({
      imports: [
        DMRSequelizeConfigModule.register({
          database: process.env.DB_NAME || 'dev_db_official_journal',
          host: process.env.DB_HOST || 'localhost',
          password: process.env.DB_PASSWORD || 'dev_db',
          username: process.env.DB_USERNAME || 'dev_db',
          port: Number(process.env.DB_PORT) || 5433,
          models: [...OFFICIAL_JOURNAL_DB],
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    UserModule,
    CaseModule,
    AdvertModule,
    AdvertTypeModule,
    StatisticsModule,
    CategoryModule,
    DepartmentModule,
    InstitutionModule,
    PdfModule,
  ],
  controllers: [
    CategoryAdminController,
    AdvertTypeAdminController,
    InstitutionAdminController,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
