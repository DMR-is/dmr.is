import { LoggingModule } from '@dmr.is/logging'
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

@Module({
  imports: [
    LoggingModule,
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
    HealthModule,
    DepartmentModule,
    AdvertTypeModule,
    CategoryModule,
    InstitutionModule,
    AdvertModule,
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
