/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { SwaggerModule } from '@nestjs/swagger'
import { JournalModule } from './app/journal.module'
import { openApi } from './openApi'
import { logger } from '@dmr.is/logging'
import { apmInit } from '@dmr.is/apm'

async function bootstrap() {
  const globalPrefix = 'api'
  const swaggerPath = 'swagger'

  const app = await NestFactory.create(JournalModule)

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