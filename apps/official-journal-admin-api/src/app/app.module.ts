import { LoggingModule } from '@dmr.is/logging'
import { OFFICIAL_JOURNAL_DB } from '@dmr.is/official-journal/models'
import { AdvertTypeAdminController } from '@dmr.is/official-journal/modules/advert-type'
import { CategoryAdminController } from '@dmr.is/official-journal/modules/category'
import { InstitutionAdminController } from '@dmr.is/official-journal/modules/institution'
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
    // CaseModule,
    // AdvertModule,
    // ApplicationModule,
    // StatisticsModule,
    // CategoryModule,
    // DepartmentModule,
    // InstitutionModule,
    // PdfModule,
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
