import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { SequelizeModule } from '@nestjs/sequelize'
import { ThrottlerModule } from '@nestjs/throttler'

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

import { ApiKeyCoreModule } from '../modules/api-key/api-key.core.module'
import { PartnerSwaggerModule } from '../modules/swagger/partner.swagger.module'
import { HealthController } from './health.controller'

/**
 * The public third-party API.
 *
 * Registers the same database and the same model graph as
 * `directorate-of-equality-api`, because it writes reports itself rather than
 * forwarding them. `DOE_MODELS` is shared for exactly that reason: two
 * hand-maintained lists would drift, and a model missing here only would surface
 * at boot in this service alone.
 *
 * Three things it deliberately does NOT have:
 *
 * - **No `ScheduleModule` or tasks.** Only the sibling app schedules the crons.
 *   Two schedulers against one database would double-fire every job.
 * - **No migrations.** The sibling app remains sole migrator and its container
 *   runs `db:migrate` on start; this one boots `node main.js` only. Deploy order
 *   is therefore doe-api first, always.
 * - **No admin or island.is surface.** It answers only the partner controllers,
 *   under its own swagger document.
 */
@Module({
  imports: [
    LoggingModule,
    // Per-key rather than per-IP; see ApiKeyThrottlerGuard. The window is
    // generous because a legitimate integrator submits a handful of reports a
    // year per customer — this is a backstop against a broken retry loop or a
    // credential-stuffing sweep, not a commercial quota.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 3600000, // 1 hour
        limit: 5000,
      },
    ]),
    ApiKeyCoreModule,
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
          models: DOE_MODELS,
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    // Also the runtime registration point for the published document, so a
    // controller cannot be routed without being documented.
    PartnerSwaggerModule,
  ],
  controllers: [HealthController],
  providers: [
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
