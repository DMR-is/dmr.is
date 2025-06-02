import { WinstonModule } from 'nest-winston'

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'

import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'

import { AppModule } from './app/app.module'
import { openApi } from './openApi'

async function bootstrap() {
  const globalPrefix = 'api'
  const version = 'v1'
  const swaggerPath = 'swagger'

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
  })

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

  const document = SwaggerModule.createDocument(app, openApi, {
    // autoTagControllers: false,
  })
  SwaggerModule.setup(swaggerPath, app, document)

  apmInit()

  const port = process.env.LEGAL_GAZETTE_API_PORT || 4100
  await app.listen(port)

  Logger.log(
    `🚀 Legal gazette API is running on: http://localhost:${port}/${globalPrefix}/${version}/`,
  )
}

bootstrap()
