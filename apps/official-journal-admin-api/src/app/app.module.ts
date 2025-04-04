import { LoggingModule } from '@dmr.is/logging'
import { CaseChannelModule } from '@dmr.is/official-journa/modules/case-channel'
import { OFFICIAL_JOURNAL_DB } from '@dmr.is/official-journal/models'
import { AdvertModule } from '@dmr.is/official-journal/modules/advert'
import { AdvertCorrectionModule } from '@dmr.is/official-journal/modules/advert-correction'
import {
  AdvertTypeAdminController,
  AdvertTypeModule,
} from '@dmr.is/official-journal/modules/advert-type'
import {
  CaseController,
  CaseModule,
} from '@dmr.is/official-journal/modules/case'
import { CaseTagModule } from '@dmr.is/official-journal/modules/case-tag'
import {
  CategoryAdminController,
  CategoryModule,
} from '@dmr.is/official-journal/modules/category'
import { CommunicationStatusModule } from '@dmr.is/official-journal/modules/communication-status'
import { DepartmentModule } from '@dmr.is/official-journal/modules/department'
import {
  InstitutionAdminController,
  InstitutionModule,
} from '@dmr.is/official-journal/modules/institution'
import { PdfModule } from '@dmr.is/official-journal/modules/pdf'
import { SignatureModule } from '@dmr.is/official-journal/modules/signature'
import {
  UserController,
  UserModule,
} from '@dmr.is/official-journal/modules/user'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'
import { HealthModule } from '@dmr.is/shared/modules/health'
import {
  DMRSequelizeConfigModule,
  DMRSequelizeConfigService,
} from '@dmr.is/shared/modules/sequelize'

import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { SequelizeModule } from '@nestjs/sequelize'

import { OfficialJournalCaseModule } from './modules/case/ojoi-case.module'
import { PaymentModule } from './modules/payment/payment.module'
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
    UserModule,
    OfficialJournalCaseModule,
    AdvertModule,
    AdvertTypeModule,
    StatisticsModule,
    CategoryModule,
    DepartmentModule,
    InstitutionModule,
    PdfModule,
    CaseChannelModule,
    CommunicationStatusModule,
    CaseTagModule,
    AdvertCorrectionModule,
    OfficialJournalCaseModule,
    CaseModule,
    SignatureModule,
    PaymentModule,
  ],
  controllers: [
    CategoryAdminController,
    AdvertTypeAdminController,
    InstitutionAdminController,
    CaseController,
    UserController,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
