import { json, urlencoded } from 'express'
import { WinstonModule } from 'nest-winston'

import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'

import { AppModule } from './app/app.module'
import { API_VERSION,applyApiRouting, GLOBAL_PREFIX } from './api-routing'
import { setupSwaggerDocument } from './setupSwaggerDocument'
import { SWAGGER_CONFIG } from './swagger.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
  })

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
