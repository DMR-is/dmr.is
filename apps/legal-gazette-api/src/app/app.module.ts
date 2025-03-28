import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import {
  DMRSequelizeConfigModule,
  DMRSequelizeConfigService,
} from '@dmr.is/shared/modules/sequelize'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'
import { SequelizeModule } from '@nestjs/sequelize'
import { LoggingModule } from '@dmr.is/logging'
import { CaseTypeModule } from '@dmr.is/legal-gazette/modules/case-type'
import {
  GlobalExceptionFilter,
  HttpExceptionFilter,
  SequelizeExceptionFilter,
} from '@dmr.is/shared/filters'
import { HealthModule } from '@dmr.is/shared/modules/health'
import { CLSMiddleware } from '@dmr.is/middleware'
import { LEGAL_GAZETTE_NAMESPACE } from '@dmr.is/legal-gazette/constants'
import { LegalGazetteNamespaceMiddleware } from '@dmr.is/legal-gazette/ middleware'

@Module({
  imports: [
    LoggingModule,
    SequelizeModule.forRootAsync({
      imports: [
        DMRSequelizeConfigModule.register({
          database: process.env.DB_NAME || 'dev_db_legal_gazette',
          host: process.env.DB_HOST || 'localhost',
          password: process.env.DB_PASSWORD || 'dev_db',
          username: process.env.DB_USERNAME || 'dev_db',
          port: 5434,
          clsNamespace: LEGAL_GAZETTE_NAMESPACE,
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    CaseTypeModule,
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
