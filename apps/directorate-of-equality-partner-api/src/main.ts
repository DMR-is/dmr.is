import { WinstonModule } from 'nest-winston'

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'

import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'

import { AppModule } from './app/app.module'
import { API_VERSION, GLOBAL_PREFIX } from './api-routing'
import { configureApp } from './configure-app'
import { setupSwaggerDocument } from './setupSwaggerDocument'
import { SWAGGER_CONFIG } from './swagger.config'

async function bootstrap() {
  // Typed as the Express application because `trust proxy` below is an Express
  // setting; the generic INestApplication does not expose `set`.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
  })

  configureApp(app)

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
