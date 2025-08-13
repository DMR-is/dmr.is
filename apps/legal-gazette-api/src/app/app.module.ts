import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { SequelizeModule } from '@nestjs/sequelize'

import { CLS_NAMESPACE } from '@dmr.is/constants'
import { DMRSequelizeConfigModule, DMRSequelizeConfigService } from '@dmr.is/db'
import { LoggingModule } from '@dmr.is/logging'
import { CLSMiddleware, LogRequestMiddleware } from '@dmr.is/middleware'
import { AuthModule, HealthModule } from '@dmr.is/modules'
import {
  GlobalExceptionFilter,
  HttpExceptionFilter,
  SequelizeExceptionFilter,
} from '@dmr.is/shared/filters'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'

import { AdvertModel } from '../modules/advert/advert.model'
import { AdvertModule } from '../modules/advert/advert.module'
import { CommonAdvertModel } from '../modules/advert/common/common-advert.model'
import { DivisionEndingAdvertModel } from '../modules/advert/division/models/division-ending-advert.model'
import { DivisionMeetingAdvertModel } from '../modules/advert/division/models/division-meeting-advert.model'
import { RecallAdvertModel } from '../modules/advert/recall/recall-advert.model'
import { ApplicationModule } from '../modules/applications/application.module'
import { CommonApplicationModule } from '../modules/applications/common/common-application.module'
import { RecallApplicationModel } from '../modules/applications/recall/recall-application.model'
import { BaseEntityModule } from '../modules/base-entity/base-entity.module'
import { CaseModel } from '../modules/case/case.model'
import { CaseModule } from '../modules/case/case.module'
import { CategoryModel } from '../modules/category/category.model'
import { CommunicationChannelModel } from '../modules/communication-channel/communication-channel.model'
import { CourtDistrictModel } from '../modules/court-district/court-district.model'
import { SettlementModel } from '../modules/settlement/settlement.model'
import { StatusModel } from '../modules/status/status.model'
import { SubscriberModel } from '../modules/subscribers/subscriber.model'
import { SubscriberModule } from '../modules/subscribers/subscriber.module'
import { ApplicationWebModule } from '../modules/swagger/application-web.module'
import { TypeModel } from '../modules/type/type.model'
import { UserModel } from '../modules/users/users.model'
import { UsersModule } from '../modules/users/users.module'

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
          clsNamespace: CLS_NAMESPACE,
          debugLog: true,
          autoLoadModels: false,
          models: [
            UserModel,
            TypeModel,
            CategoryModel,
            CourtDistrictModel,
            StatusModel,
            CommunicationChannelModel,
            CaseModel,
            CommonAdvertModel,
            AdvertModel,
            SettlementModel,
            RecallAdvertModel,
            DivisionMeetingAdvertModel,
            DivisionEndingAdvertModel,
            RecallApplicationModel,
            SubscriberModel,
          ],
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    BaseEntityModule,
    CaseModule,
    CommonApplicationModule,
    AdvertModule,
    SubscriberModule,
    UsersModule,
    ApplicationModule,
    {
      module: AuthModule,
      global: true,
    },
    HealthModule,
    ApplicationWebModule,
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
  async configure(consumer: MiddlewareConsumer) {
    consumer.apply(CLSMiddleware).forRoutes('*')
    consumer.apply(LogRequestMiddleware).forRoutes('*')
  }
}
