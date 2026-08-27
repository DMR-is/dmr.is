import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { SequelizeModule } from '@nestjs/sequelize'

import { CLS_NAMESPACE } from '@dmr.is/constants'
import { DMRSequelizeConfigModule, DMRSequelizeConfigService } from '@dmr.is/db'
import { DOE_MODELS } from '@dmr.is/doe-modules/models'
import { LoggingModule } from '@dmr.is/logging'
import {
  GlobalExceptionFilter,
  HttpExceptionFilter,
  SequelizeExceptionFilter,
} from '@dmr.is/shared-filters'
import { CLSMiddleware, LogRequestMiddleware } from '@dmr.is/shared-middleware'

import { DeclaredAccessGuard } from '../core/guards/declared-access/declared-access.guard'
import { DoeApplicationSwaggerModule } from '../modules/swagger/doe-application.swagger.module'
import { DoeWebSwaggerModule } from '../modules/swagger/doe-web.swagger.module'
import { TasksModule } from '../tasks/tasks.module'
import { HealthController } from './health.controller'
@Module({
  imports: [
    LoggingModule,
    ScheduleModule.forRoot(),
    SequelizeModule.forRootAsync({
      imports: [
        DMRSequelizeConfigModule.register({
          database: process.env.DB_NAME || 'dev_db_directorate_of_equality',
          host: process.env.DB_HOST || 'localhost',
          password: process.env.DB_PASS || 'dev_db',
          username: process.env.DB_USER || 'dev_db',
          port:
            Number(process.env.DB_PORT) ||
            Number(process.env.DIRECTORATE_OF_EQUALITY_DB_PORT) ||
            5435,
          clsNamespace: CLS_NAMESPACE,
          debugLog: process.env.DB_DEBUG === 'true',
          autoLoadModels: false,
          // One registration list for the whole schema, shared with the
          // partner API. Two hand-maintained lists would drift.
          models: DOE_MODELS,
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    // The two swagger aggregates are also the runtime registration points, so
    // a controller can never be routed without appearing in a published
    // document (enforced by swagger-coverage.spec.ts).
    DoeApplicationSwaggerModule,
    DoeWebSwaggerModule,
    TasksModule,
  ],
  controllers: [HealthController],
  providers: [
    // Default-deny for every route in the API. Runs before any controller or
    // route guard, and refuses anything whose @UseGuards chain does not state
    // who may call it. Authorization is opt-out, not opt-in: a new controller
    // is unreachable until its author declares an audience.
    {
      provide: APP_GUARD,
      useClass: DeclaredAccessGuard,
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
