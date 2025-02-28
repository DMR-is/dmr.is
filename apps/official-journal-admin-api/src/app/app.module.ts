import { SequelizeConfigService } from '@dmr.is/db'
import { LogRequestMiddleware } from '@dmr.is/middleware'
import {
  ApplicationModule,
  HealthModule,
  SharedJournalModule,
  SignatureModule,
} from '@dmr.is/modules'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common'
import { APP_INTERCEPTOR, RouterModule } from '@nestjs/core'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModule } from './case/case.module'
import { StatisticsModule } from './statistics/statistics.module'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useClass: SequelizeConfigService,
    }),
    ApplicationModule,
    CaseModule,
    StatisticsModule,
    SharedJournalModule,
    SignatureModule,
    HealthModule,
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LogRequestMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
