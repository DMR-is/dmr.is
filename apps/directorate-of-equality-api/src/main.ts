import { json, urlencoded } from 'express'
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

bootstrap()
