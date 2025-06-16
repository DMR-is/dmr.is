import { WinstonModule } from 'nest-winston'

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'

import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'

import { AppModule } from './app/app.module'
import { CategoryModule } from './modules/category/category.module'
import { CommonApplicationModule } from './modules/common-application/common-application.module'
import { openApi } from './openApi'

async function bootstrap() {
  const globalPrefix = 'api'
  const version = 'v1'
  const internalSwaggerPath = 'swagger'
  const islandSwaggerPath = 'island-is-swagger'
  const islandApiTag = 'Legal gazette - common application'

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

  const internalDocument = SwaggerModule.createDocument(app, openApi)
  SwaggerModule.setup(internalSwaggerPath, app, internalDocument)

  const islandDocument = SwaggerModule.createDocument(app, openApi, {
    include: [CommonApplicationModule, CategoryModule],
    deepScanRoutes: true,
    autoTagControllers: false,
  })

  // replace the default tag with 'Legal gazette - common application'
  islandDocument.tags = [{ name: islandApiTag }]

  // tag routes
  Object.values(islandDocument.paths).forEach((path) => {
    for (const method of Object.values(path)) {
      method.tags = [islandApiTag]
    }
  })

  SwaggerModule.setup(islandSwaggerPath, app, islandDocument, {
    customSiteTitle: 'Legal Gazette API',
    jsonDocumentUrl: `/${islandSwaggerPath}/json`,
  })

  apmInit()

  const port = process.env.LEGAL_GAZETTE_API_PORT || 4100
  await app.listen(port)

  Logger.log(
    `🚀 Legal gazette API is running on: http://localhost:${port}/${globalPrefix}/${version}/`,
  )
}

bootstrap()
