import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { SequelizeModule } from '@nestjs/sequelize'

import { DMRSequelizeConfigModule, DMRSequelizeConfigService } from '@dmr.is/db'
import { LegalGazetteNamespaceMiddleware } from '@dmr.is/legal-gazette/ middleware'
import { LEGAL_GAZETTE_NAMESPACE } from '@dmr.is/legal-gazette/constants'
import { LoggingModule } from '@dmr.is/logging'
import { CLSMiddleware } from '@dmr.is/middleware'
import { HealthModule } from '@dmr.is/modules'
import {
  GlobalExceptionFilter,
  HttpExceptionFilter,
  SequelizeExceptionFilter,
} from '@dmr.is/shared/filters'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'

import { LegalGazetteApplicationModule } from '../modules/application/application.module'
import { CaseCategoryModel } from '../modules/case-category/case-category.model'
import { CaseCategoryModule } from '../modules/case-category/case-category.module'
import { CasePublicationDateModel } from '../modules/case-publication-dates/case-publication-dates.model'
import { CaseStatusModel } from '../modules/case-status/case-status.model'
import { CaseStatusModule } from '../modules/case-status/case-status.module'
import { CaseTypeModel } from '../modules/case-type/case-type.model'
import { CaseTypeModule } from '../modules/case-type/case-type.module'
import { CaseModule } from '../modules/cases/case.module'
import { CaseModel } from '../modules/cases/cases.model'
import { CommunicationChannelModel } from '../modules/communication-channel/communication-channel.model'

@Module({
  imports: [
    LoggingModule,
    SequelizeModule.forRootAsync({
      imports: [
        DMRSequelizeConfigModule.register({
          database: process.env.DB_NAME || 'dev_db_legal_gazette',
          host: process.env.DB_HOST || 'localhost',
          password: process.env.DB_PASS || 'dev_db',
          username: process.env.DB_USER || 'dev_db',
          port:
            Number(process.env.DB_PORT) ||
            Number(process.env.LEGAL_GAZETTE_DB_PORT) ||
            5434,
          clsNamespace: LEGAL_GAZETTE_NAMESPACE,
          debugLog: true,
          autoLoadModels: false,
          models: [
            CaseTypeModel,
            CaseCategoryModel,
            CaseStatusModel,
            CasePublicationDateModel,
            CommunicationChannelModel,
            CaseModel,
          ],
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    CaseTypeModule,
    CaseCategoryModule,
    CaseStatusModule,
    CaseModule,
    LegalGazetteApplicationModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: SequelizeExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LegalGazetteNamespaceMiddleware).forRoutes('*')
    consumer.apply(CLSMiddleware).forRoutes('*')
  }
}
