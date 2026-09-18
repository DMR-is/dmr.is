import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
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

import { DeclaredAccessGuard } from '../core/guards/declared-access/declared-access.guard'
import { IpThrottlerGuard } from '../core/guards/ip-throttler/ip-throttler.guard'
import { PER_IP_THROTTLER, PER_KEY_THROTTLER } from '../core/guards/throttlers'
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
    // Two buckets, because one cannot cover both halves of the traffic: the
    // per-key one runs after authentication and so never sees a rejected
    // credential, and the per-IP one runs before it and so cannot know the
    // tenant. See core/guards/throttlers.ts.
    ThrottlerModule.forRoot([
      {
        // Per key, across the whole surface. Generous because a legitimate
        // integrator submits a handful of reports a year per customer — this is
        // a backstop against a broken retry loop, not a commercial quota.
        name: PER_KEY_THROTTLER,
        ttl: 3600000, // 1 hour
        limit: 5000,
      },
      {
        // Per client IP, counted before anything is authenticated. Set well
        // above any real integrator's burst: its job is to put a ceiling on
        // what an unauthenticated flood can cost us, not to police legitimate
        // callers, who are bounded by their key instead.
        name: PER_IP_THROTTLER,
        ttl: 60000, // 1 minute
        limit: 600,
        // Headers suppressed: the per-key bucket owns the published
        // X-RateLimit contract, and a second suffixed set on every response
        // would only tell a caller about a limit they are not the subject of.
        setHeaders: false,
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
    // Global so it runs BEFORE every controller-level guard, ApiKeyGuard
    // included. That ordering is the entire reason it exists: a guard declared
    // after ApiKeyGuard is unreachable on the 401 path, so nothing else on this
    // surface can count a request that failed to authenticate.
    //
    // First of the two global guards on purpose. Nest runs them in registration
    // order, so counting happens before DeclaredAccessGuard can refuse a route
    // — otherwise a flood at an undeclared path would cost us the refusal on
    // every request without ever being bounded.
    {
      provide: APP_GUARD,
      useClass: IpThrottlerGuard,
    },
    // Default-deny for every route. Runs before any controller or route guard
    // and refuses anything whose @UseGuards chain does not state who may call
    // it. Authorization is opt-out, not opt-in — which matters more here than on
    // the sibling app, because an undeclared route on this surface is exposed to
    // the internet and can write to the register.
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
