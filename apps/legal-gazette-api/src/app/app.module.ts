import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { SequelizeModule } from '@nestjs/sequelize'

import { DMRSequelizeConfigModule, DMRSequelizeConfigService } from '@dmr.is/db'
import { LegalGazetteNamespaceMiddleware } from '@dmr.is/legal-gazette/ middleware'
import { LEGAL_GAZETTE_NAMESPACE } from '@dmr.is/legal-gazette/constants'
import { LoggingModule } from '@dmr.is/logging'
import { CLSMiddleware } from '@dmr.is/middleware'
import { AuthModule, HealthModule } from '@dmr.is/modules'
import {
  GlobalExceptionFilter,
  HttpExceptionFilter,
  SequelizeExceptionFilter,
} from '@dmr.is/shared/filters'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'

import { AdvertModel } from '../modules/advert/advert.model'
import { AdvertModule } from '../modules/advert/advert.module'
import { CaseModel } from '../modules/case/case.model'
import { CaseModule } from '../modules/case/case.module'
import { CategoryModel } from '../modules/category/category.model'
import { CategoryModule } from '../modules/category/category.module'
import { CommonAdvertModel } from '../modules/common-advert/common-advert.model'
import { CommonApplicationModule } from '../modules/common-application/common-application.module'
import { CommunicationChannelModel } from '../modules/communication-channel/communication-channel.model'
import { InstitutionModel } from '../modules/institution/institution.model'
import { StatusModel } from '../modules/status/status.model'
import { StatusModule } from '../modules/status/status.module'
import { TypeModel } from '../modules/type/type.model'
import { TypeModule } from '../modules/type/type.module'
import { UserInstitutionModel } from '../modules/users/user-institutions.model'
import { UserRoleModel } from '../modules/users/user-roles.model'
import { UserModel } from '../modules/users/users.model'

@Module({
  imports: [
    LoggingModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
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
            TypeModel,
            CategoryModel,
            StatusModel,
            CommunicationChannelModel,
            CaseModel,
            CommonAdvertModel,
            AdvertModel,
            UserRoleModel,
            UserModel,
            InstitutionModel,
            UserInstitutionModel,
          ],
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    TypeModule,
    CategoryModule,
    StatusModule,
    CaseModule,
    CommonApplicationModule,
    AdvertModule,
    {
      module: AuthModule,
      global: true,
    },
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
