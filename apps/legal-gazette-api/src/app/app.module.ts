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

import { AdvertModel } from '../models/advert.model'
import { AdvertPublicationModel } from '../models/advert-publication.model'
import { AdvertTypeFeeCodeModel } from '../models/advert-type-fee-code.model'
import { ApplicationModel } from '../models/application.model'
import { CaseModel } from '../models/case.model'
import { CategoryModel } from '../models/category.model'
import { CommentModel } from '../models/comment.model'
import { CommunicationChannelModel } from '../models/communication-channel.model'
import { CourtDistrictModel } from '../models/court-district.model'
import { FeeCodeModel } from '../models/fee-code.model'
import { ForeclosureModel } from '../models/foreclosure.model'
import { ForeclosurePropertyModel } from '../models/foreclosure-property.model'
import { SettlementModel } from '../models/settlement.model'
import { StatusModel } from '../models/status.model'
import { SubscriberModel } from '../models/subscriber.model'
import { TBRTransactionModel } from '../models/tbr-transactions.model'
import { TypeModel } from '../models/type.model'
import { TypeCategoriesModel } from '../models/type-categories.model'
import { UserModel } from '../models/users.model'
import { AdvertControllerModule } from '../modules/advert/advert.controller.module'
import { PublicationControllerModule } from '../modules/advert/publications/publication.controller.module'
import { StatisticsControllerModule } from '../modules/advert/statistics/statistics.controller.module'
import { ApplictionControllerModule } from '../modules/applications/application.controller.module'
import { BaseEntityControllerModule } from '../modules/base-entity/base-entity.controller.module'
import { CaseControllerModule } from '../modules/case/case.controller.module'
import { CommentControllerModule } from '../modules/comment/comment.controller.module'
import { CommunicationChannelControllerModule } from '../modules/communication-channel/communication-channel.module'
import { CompanyControllerModule } from '../modules/external-systems/company/company.controller.module'
import { ForeclosureControllerModule } from '../modules/external-systems/foreclosure/foreclosure.controller.module'
import { LGNationalRegistryControllerModule } from '../modules/national-registry/national-registry.controller.module'
import { SettlementControllerModule } from '../modules/settlement/settlement.controller.module'
import { SubscriberControllerModule } from '../modules/subscribers/subscriber.controller.module'
import { ApplicationWebModule } from '../modules/swagger/application-web.module'
import { ExternalSystemsModule } from '../modules/swagger/external-systems.module'
import { IslandIsApplicationModule } from '../modules/swagger/island-is-application.module'
import { PublicWebModule } from '../modules/swagger/public-web.module'
import { TypesCategoriesControllerModule } from '../modules/type-categories/type-categories.module'
import { UserControllerModule } from '../modules/users/users.controller.module'

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
            ForeclosureModel,
            ForeclosurePropertyModel,
          ],
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    BaseEntityControllerModule,
    CompanyControllerModule,
    CaseControllerModule,
    AdvertControllerModule,
    PublicationControllerModule,
    SubscriberControllerModule,
    UserControllerModule,
    ApplictionControllerModule,
    TypesCategoriesControllerModule,
    SettlementControllerModule,
    CommentControllerModule,
    ForeclosureControllerModule,
    {
      module: AuthModule,
      global: true,
    },
    HealthModule,
    ApplicationWebModule,
    ExternalSystemsModule,
    IslandIsApplicationModule,
    PublicWebModule,
    CommunicationChannelControllerModule,
    StatisticsControllerModule,
    LGNationalRegistryControllerModule,
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
