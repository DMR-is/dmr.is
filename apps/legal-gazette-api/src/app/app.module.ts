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
import { AdvertPublicationModel } from '../modules/advert-publications/advert-publication.model'
import { AdvertPublicationModule } from '../modules/advert-publications/advert-publication.module'
import { AdvertTypeFeeCodeModel } from '../modules/advert-type-fee-code/advert-type-fee-code.model'
import { ApplicationModel } from '../modules/applications/application.model'
import { ApplicationModule } from '../modules/applications/application.module'
import { BaseEntityModule } from '../modules/base-entity/base-entity.module'
import { CaseModel } from '../modules/case/case.model'
import { CaseModule } from '../modules/case/case.module'
import { CategoryModel } from '../modules/category/category.model'
import { CommentModel } from '../modules/comment/comment.model'
import { CommentModule } from '../modules/comment/comment.module'
import { CommunicationChannelModel } from '../modules/communication-channel/communication-channel.model'
import { CompanyModule } from '../modules/company/company.module'
import { CourtDistrictModel } from '../modules/court-district/court-district.model'
import { FeeCodeModel } from '../modules/fee-code/fee-code.model'
import { SettlementModel } from '../modules/settlement/settlement.model'
import { SettlementModule } from '../modules/settlement/settlement.module'
import { StatusModel } from '../modules/status/status.model'
import { SubscriberModel } from '../modules/subscribers/subscriber.model'
import { SubscriberModule } from '../modules/subscribers/subscriber.module'
import { ApplicationWebModule } from '../modules/swagger/application-web.module'
import { ExternalSystemsModule } from '../modules/swagger/external-systems.module'
import { IslandIsApplicationModule } from '../modules/swagger/island-is-application.module'
import { PublicWebModule } from '../modules/swagger/public-web.module'
import { TBRTransactionModel } from '../modules/tbr-transaction/tbr-transactions.model'
import { TypeModel } from '../modules/type/type.model'
import { TypeCategoriesModel } from '../modules/type-categories/type-categories.model'
import { TypesCategoriesModule } from '../modules/type-categories/type-categories.module'
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
          debugLog: process.env.DB_DEBUG === 'true',
          autoLoadModels: false,
          models: [
            UserModel,
            TypeModel,
            CategoryModel,
            CourtDistrictModel,
            StatusModel,
            CommunicationChannelModel,
            CaseModel,
            AdvertModel,
            SettlementModel,
            SubscriberModel,
            ApplicationModel,
            AdvertPublicationModel,
            TypeCategoriesModel,
            FeeCodeModel,
            TBRTransactionModel,
            AdvertTypeFeeCodeModel,
            CommentModel,
          ],
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    BaseEntityModule,
    CompanyModule,
    CaseModule,
    AdvertModule,
    AdvertPublicationModule,
    SubscriberModule,
    UsersModule,
    ApplicationModule,
    TypesCategoriesModule,
    SettlementModule,
    CommentModule,
    {
      module: AuthModule,
      global: true,
    },
    HealthModule,
    ApplicationWebModule,
    ExternalSystemsModule,
    IslandIsApplicationModule,
    PublicWebModule,
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
