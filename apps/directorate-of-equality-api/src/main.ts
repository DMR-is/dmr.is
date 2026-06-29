import { json, raw, urlencoded } from 'express'
import { WinstonModule } from 'nest-winston'

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'

import { AppModule } from './app/app.module'
import { setupSwaggerDocument } from './setupSwaggerDocument'
import { SWAGGER_CONFIG } from './swagger.config'

async function bootstrap() {
  const globalPrefix = 'api'
  const version = 'v1'

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: logger,
    }),
  })

  // Local-dev S3 bypass: the workbook is PUT straight to the API as raw bytes
  // (see ImportUploadLocalController). Parse it as a Buffer and allow the full
  // 20MB workbook cap, above the 6mb JSON limit below.
  app.use('/api/v1/imports/local', raw({ type: () => true, limit: '25mb' }))
  app.use(json({ limit: '6mb' }))
  app.use(urlencoded({ extended: true, limit: '6mb' }))

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  app.setGlobalPrefix(globalPrefix)
  app.enableCors()
  app.enableVersioning({
    type: VersioningType.URI,
  })

  for (const config of SWAGGER_CONFIG) {
    setupSwaggerDocument(app, config)
  }

  apmInit()

  const port = process.env.DIRECTORATE_OF_EQUALITY_API_PORT || 5100
  await app.listen(port)

  const tmpLogger = new Logger('DirectorateofEqualityAPI')

  tmpLogger.log(
    `🚀 Directorate of Equality API is running on: http://localhost:${port}/${globalPrefix}/${version}/`,
  )
}

void bootstrap()
