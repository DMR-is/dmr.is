/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { json, urlencoded } from 'express'
import { WinstonModule } from 'nest-winston'

import { VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'

import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'
import { ExceptionFactoryPipe } from '@dmr.is/pipelines'

import { AppModule } from './app/app.module'
import { OJOIExceptionFilter } from './exceptionFilter'
import { openApi } from './openApi'

async function bootstrap() {
  const globalPrefix = 'api'
  const swaggerPath = 'swagger'

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
  })

  app.use(json({ limit: '8mb' }))
  app.use(urlencoded({ extended: true, limit: '8mb' }))

  app.useGlobalPipes(ExceptionFactoryPipe())
  app.useGlobalFilters(new OJOIExceptionFilter())
  app.setGlobalPrefix(globalPrefix)
  app.enableCors()
  app.enableVersioning({
    type: VersioningType.URI,
  })

  const document = SwaggerModule.createDocument(app, openApi, {
    autoTagControllers: false,
  })
  SwaggerModule.setup(swaggerPath, app, document)

  apmInit()

  const port = process.env.ADMIN_PORT || 4000
  await app.listen(port)
  logger.info(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  )
}

bootstrap()
