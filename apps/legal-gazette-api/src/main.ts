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

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      enableDebugMessages: true,
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

  const port = process.env.LEGAL_GAZETTE_API_PORT || 4100
  await app.listen(port)

  const tmpLogger = new Logger('LegalGazetteAPI')

  tmpLogger.log(
    `🚀 Legal gazette API is running on: http://localhost:${port}/${globalPrefix}/${version}/`,
  )
}

bootstrap()
