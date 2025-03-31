import { LoggingModule } from '@dmr.is/logging'
import { OFFICIAL_JOURNAL_DB } from '@dmr.is/official-journal/models'
import { AdvertTypeAdminController } from '@dmr.is/official-journal/modules/advert-type'
import { AuthModule } from '@dmr.is/official-journal/modules/auth'
import {
  CategoryAdminController,
  CategoryModule,
} from '@dmr.is/official-journal/modules/category'
import { CommentModule } from '@dmr.is/official-journal/modules/comment'
import { DepartmentModule } from '@dmr.is/official-journal/modules/department'
import {
  InstitutionAdminController,
  InstitutionModule,
} from '@dmr.is/official-journal/modules/institution'
import { PdfModule } from '@dmr.is/official-journal/modules/pdf'
import { PriceModule } from '@dmr.is/official-journal/modules/price'
import { SignatureModule } from '@dmr.is/official-journal/modules/signature'
import {
  UserController,
  UserModule,
} from '@dmr.is/official-journal/modules/user'
import { UtilityModule } from '@dmr.is/official-journal/modules/utility'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'
import { ApplicationModule } from '@dmr.is/shared/modules/application'
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
    AuthModule,
    CaseModule,
    ApplicationModule,
    StatisticsModule,
    SignatureModule,
    CategoryModule,
    DepartmentModule,
    UserModule,
    InstitutionModule,
    CommentModule,
    PdfModule,
    PriceModule,
    UtilityModule,
  ],
  controllers: [
    CategoryAdminController,
    AdvertTypeAdminController,
    UserController,
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
