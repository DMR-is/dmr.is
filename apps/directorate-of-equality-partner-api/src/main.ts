import { json, urlencoded } from 'express'
import { WinstonModule } from 'nest-winston'

import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'

import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'

import { AppModule } from './app/app.module'
import { API_VERSION,applyApiRouting, GLOBAL_PREFIX } from './api-routing'
import { setupSwaggerDocument } from './setupSwaggerDocument'
import { SWAGGER_CONFIG } from './swagger.config'

async function bootstrap() {
  // Typed as the Express application because `trust proxy` below is an Express
  // setting; the generic INestApplication does not expose `set`.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
  })

  // One proxy in front: the ALB. Without this, `req.ip` is the socket peer --
  // the ALB itself -- so the per-IP throttler would collapse every caller in
  // the world into a single bucket, and one flood would throttle everyone.
  //
  // The count must be exact rather than `true`. Trusting the whole chain would
  // let a caller prepend its own X-Forwarded-For and rotate a fake address per
  // request, which defeats the limit silently. At 1, Express takes the entry the
  // ALB appended, which is the real peer and not client-supplied. If a CDN is
  // ever put in front of this service, this number changes with it.
  app.set('trust proxy', 1)

  // A submitted salary report carries the whole parsed workbook inline, and a
  // large employer's payload runs to megabytes. 8mb rather than the sibling
  // app's 6mb because this surface has no island.is payload cap in front of it
  // — a vendor posts the report whole.
  app.use(json({ limit: '8mb' }))
  app.use(urlencoded({ extended: true, limit: '8mb' }))

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      // Unlike the sibling app, which strips unknown fields silently. On a
      // public API that silence is a trap: a vendor misspells a field, the
      // request succeeds, and the value is quietly absent from the report. Tell
      // them instead.
      forbidNonWhitelisted: true,
    }),
  )

  applyApiRouting(app)

  // No enableCors(), deliberately. An API key must never be used from a browser
  // — it cannot be kept secret there — so there is no legitimate cross-origin
  // caller to permit. This is a server-to-server surface.

  for (const config of SWAGGER_CONFIG) {
    setupSwaggerDocument(app, config)
  }

  apmInit()

  const port = process.env.DIRECTORATE_OF_EQUALITY_PARTNER_API_PORT || 5300
  await app.listen(port)

  new Logger('DirectorateOfEqualityPartnerAPI').log(
    `🚀 Directorate of Equality Partner API is running on: http://localhost:${port}/${GLOBAL_PREFIX}/${API_VERSION}/`,
  )
}

void bootstrap()
