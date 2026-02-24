import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, RouterModule } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { SequelizeModule } from '@nestjs/sequelize'

import { DMRSequelizeConfigModule, DMRSequelizeConfigService } from '@dmr.is/db'
import { LogRequestMiddleware } from '@dmr.is/middleware'
import {
  ApplicationModule,
  IssuesModule,
  IssuesTaskModule,
  SharedJournalModule,
  SignatureModule,
} from '@dmr.is/ojoi/modules'
import {
  GlobalExceptionFilter,
  HttpExceptionFilter,
  SequelizeExceptionFilter,
} from '@dmr.is/shared/filters'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'
import { HealthModule } from '@dmr.is/shared-modules'

import { CaseModule } from './case/case.module'
import { StatisticsModule } from './statistics/statistics.module'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [
        DMRSequelizeConfigModule.register({
          database: process.env.DB_NAME || 'dev_db_official_journal',
          host: process.env.DB_HOST || 'localhost',
          password: process.env.DB_PASS || 'dev_db',
          username: process.env.DB_USER || 'dev_db',
          port: Number(process.env.DB_PORT) || 5433,
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    ScheduleModule.forRoot(),
    ApplicationModule,
    CaseModule,
    StatisticsModule,
    SharedJournalModule,
    SignatureModule,
    HealthModule,
    IssuesModule,
    IssuesTaskModule,
    RouterModule.register([
      {
        path: '/',
        module: CaseModule,
      },
      {
        path: 'statistics',
        module: StatisticsModule,
      },
      {
        path: 'journal',
        module: SharedJournalModule,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
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
    consumer
      .apply(LogRequestMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
