/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { WinstonModule } from 'nest-winston'

import { VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'

import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'
import { ExceptionFactoryPipe } from '@dmr.is/pipelines'

import { AppModule } from './app/app.module'
import { openApi } from './openApi'

async function bootstrap() {
  const globalPrefix = 'api'
  const swaggerPath = 'swagger'

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
  })

  app.useGlobalPipes(ExceptionFactoryPipe())
  app.setGlobalPrefix(globalPrefix)
  app.enableVersioning({
    type: VersioningType.URI,
  })

  const document = SwaggerModule.createDocument(app, openApi, {
    autoTagControllers: false,
  })
  SwaggerModule.setup(swaggerPath, app, document)

  apmInit()

  const port = process.env.APPLICATION_PORT || 5000
  await app.listen(port)
  logger.info(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  )
}

bootstrap()
