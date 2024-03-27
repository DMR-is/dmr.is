/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { WinstonModule } from 'nest-winston'
import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'

import { ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app/app.module'
import { openApi } from './openApi'

async function bootstrap() {
  const globalPrefix = 'api'
  const swaggerPath = 'swagger'

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
  })

  // TODO make this behave with nest
  // app.useLogger(logger)

  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.setGlobalPrefix(globalPrefix)
  app.enableCors()
  app.enableVersioning({
    type: VersioningType.URI,
  })

  const document = SwaggerModule.createDocument(app, openApi)
  SwaggerModule.setup(swaggerPath, app, document)

  apmInit()

  const port = process.env.PORT || 3000
  await app.listen(port)
  logger.info(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  )
}

bootstrap()
