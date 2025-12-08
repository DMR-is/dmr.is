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

import { AuthorizationGuardModule } from '../core/guards/authorization-guard.module'
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
import { IssueModel } from '../models/issues.model'
import { IssueSettingsModel } from '../models/issues-settings.model'
import { LegacyMigrationTokenModel } from '../models/legacy-migration-token.model'
import { LegacySubscriberModel } from '../models/legacy-subscriber.model'
import { SettlementModel } from '../models/settlement.model'
import { SignatureModel } from '../models/signature.model'
import { StatusModel } from '../models/status.model'
import { SubscriberModel } from '../models/subscriber.model'
import { TBRTransactionModel } from '../models/tbr-transactions.model'
import { TypeModel } from '../models/type.model'
import { TypeCategoriesModel } from '../models/type-categories.model'
import { UserModel } from '../models/users.model'
import { IssuesControllerModule } from '../modules/advert/issues/issues.controller.module'
import { SignatureControllerModule } from '../modules/advert/signature/signature.controller.module'
import { StatisticsControllerModule } from '../modules/advert/statistics/statistics.controller.module'
import { CommunicationChannelControllerModule } from '../modules/communication-channel/communication-channel.module'
import { LegacyMigrationControllerModule } from '../modules/legacy-migration/legacy-migration.controller.module'
import { LGNationalRegistryControllerModule } from '../modules/national-registry/national-registry.controller.module'
import { ApplicationWebSwaggerModule } from '../modules/swagger/application-web.swagger.module'
import { ExternalSystemsSwaggerModule } from '../modules/swagger/external-systems.swagger.module'
import { InternalWebSwaggerModule } from '../modules/swagger/internal-web.swagger.module'
import { IslandIsApplicationSwaggerModule } from '../modules/swagger/island-is-application.swagger.module'
import { PublicWebSwaggerModule } from '../modules/swagger/public-web.swagger.module'

@Module({
  imports: [
    LoggingModule,
    AuthorizationGuardModule, // Makes AuthorizationGuard available globally
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
            IssueModel,
            IssueSettingsModel,
            LegacySubscriberModel,
            LegacyMigrationTokenModel,
            SignatureModel,
          ],
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    HealthModule,
    ApplicationWebSwaggerModule,
    ExternalSystemsSwaggerModule,
    InternalWebSwaggerModule,
    IslandIsApplicationSwaggerModule,
    PublicWebSwaggerModule,
    CommunicationChannelControllerModule,
    StatisticsControllerModule,
    LGNationalRegistryControllerModule,
    IssuesControllerModule,
    LegacyMigrationControllerModule,
    SignatureControllerModule,
    {
      module: AuthModule,
      global: true,
    },
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
