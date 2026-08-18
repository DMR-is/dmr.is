import { json, raw, urlencoded } from 'express'
import { WinstonModule } from 'nest-winston'

import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'

import { AppModule } from './app/app.module'
import { API_VERSION, applyApiRouting, GLOBAL_PREFIX } from './api-routing'
import { setupSwaggerDocument } from './setupSwaggerDocument'
import { SWAGGER_CONFIG } from './swagger.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: logger,
    }),
  })

  // Local-dev S3 bypass: the workbook is PUT straight to the API as raw bytes
  // (see ImportUploadLocalController). Parse it as a Buffer and allow the full
  // 20MB workbook cap, above the 6mb JSON limit below. Built from the routing
  // constants rather than spelled out, so a prefix change cannot silently stop
  // this from matching and leave the upload parsed as JSON.
  app.use(
    `/${GLOBAL_PREFIX}/${API_VERSION}/imports/local`,
    raw({ type: () => true, limit: '25mb' }),
  )
  app.use(json({ limit: '6mb' }))
  app.use(urlencoded({ extended: true, limit: '6mb' }))

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  applyApiRouting(app)
  app.enableCors()

  for (const config of SWAGGER_CONFIG) {
    setupSwaggerDocument(app, config)
  }

  apmInit()

  const port = process.env.DIRECTORATE_OF_EQUALITY_API_PORT || 5100
  await app.listen(port)

  const tmpLogger = new Logger('DirectorateofEqualityAPI')

  tmpLogger.log(
    `🚀 Directorate of Equality API is running on: http://localhost:${port}/${GLOBAL_PREFIX}/${API_VERSION}/`,
  )
}

void bootstrap()
