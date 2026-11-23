/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { json, urlencoded } from 'express'
import { WinstonModule } from 'nest-winston'

import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'

import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'
import { ExceptionFactoryPipe } from '@dmr.is/pipelines'

import { AppModule } from './app/app.module'
import { applyApiRouting, GLOBAL_PREFIX } from './api-routing'
import { OJOIExceptionFilter } from './exceptionFilter'
import { buildSwaggerDocument } from './setupSwaggerDocument'
// Added comment to trigger redeploy

async function bootstrap() {
  const swaggerPath = 'swagger'

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
  })

  app.use(json({ limit: '8mb' }))
  app.use(urlencoded({ extended: true, limit: '8mb' }))

  app.useGlobalPipes(ExceptionFactoryPipe())
  app.useGlobalFilters(new OJOIExceptionFilter())
  applyApiRouting(app)
  app.enableCors()

  SwaggerModule.setup(swaggerPath, app, buildSwaggerDocument(app))

  apmInit()

  const port = process.env.ADMIN_PORT || 4000
  await app.listen(port)
  logger.info(
    `🚀 Application is running on: http://localhost:${port}/${GLOBAL_PREFIX}`,
  )
}

bootstrap()
