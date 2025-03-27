import { Logger, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app/app.module'
import { WinstonModule } from 'nest-winston'

import { logger } from '@dmr.is/logging'
import { SwaggerModule } from '@nestjs/swagger'

import { apmInit } from '@dmr.is/apm'
import { openApi } from './openApi'

async function bootstrap() {
  const globalPrefix = 'api'
  const version = 'v1'
  const swaggerPath = 'swagger'

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
  })

  app.setGlobalPrefix(globalPrefix)
  app.enableCors()
  app.enableVersioning({
    type: VersioningType.URI,
  })

  const document = SwaggerModule.createDocument(app, openApi)
  SwaggerModule.setup(swaggerPath, app, document)

  apmInit()

  const port = process.env.LEGAL_GAZETTE_API_PORT || 4100
  await app.listen(port)

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}/${version}/`,
  )
}

bootstrap()
