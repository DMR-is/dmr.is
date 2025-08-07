import { WinstonModule } from 'nest-winston'

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'

import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'

import { AppModule } from './app/app.module'
import { CommonApplicationModule } from './modules/applications/common/common-application.module'
import { BaseEntityModule } from './modules/base-entity/base-entity.module'
import { ApplicationWebModule } from './modules/swagger/application-web.module'
import { PublicWebModule } from './modules/swagger/public-web.module'
import { openApi } from './openApi'

async function bootstrap() {
  const globalPrefix = 'api'
  const version = 'v1'
  const internalSwaggerPath = 'swagger'
  const islandSwaggerPath = 'island-is-swagger'
  const islandApiTag = 'Legal gazette - common application'
  const publicSwaggerPath = 'public-swagger'
  const publicApiTag = 'Legal gazette - public API'
  const applicationWebSwaggerPath = 'application-web-swagger'
  const applicationWebApiTag = 'Legal gazette - application web API'

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: logger,
    }),
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
    include: [CommonApplicationModule, BaseEntityModule],
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

  const publicDocument = SwaggerModule.createDocument(app, openApi, {
    include: [PublicWebModule],
    deepScanRoutes: true,
    autoTagControllers: false,
  })

  // replace the default tag with 'Legal gazette - public API'
  publicDocument.tags = [{ name: publicApiTag }]

  // tag routes
  Object.values(publicDocument.paths).forEach((path) => {
    for (const method of Object.values(path)) {
      method.tags = [publicApiTag]
    }
  })

  SwaggerModule.setup(publicSwaggerPath, app, publicDocument, {
    customSiteTitle: 'Legal Gazette Public API',
    jsonDocumentUrl: `/${publicSwaggerPath}/json`,
  })

  const applicationWebDocument = SwaggerModule.createDocument(app, openApi, {
    include: [ApplicationWebModule],
    deepScanRoutes: true,
    autoTagControllers: false,
  })

  // replace the default tag with 'Legal gazette - application web API'
  applicationWebDocument.tags = [{ name: applicationWebApiTag }]

  // tag routes
  Object.values(applicationWebDocument.paths).forEach((path) => {
    for (const method of Object.values(path)) {
      method.tags = [applicationWebApiTag]
    }
  })

  SwaggerModule.setup(applicationWebSwaggerPath, app, applicationWebDocument, {
    customSiteTitle: 'Legal Gazette Application Web API',
    jsonDocumentUrl: `/${applicationWebSwaggerPath}/json`,
  })

  apmInit()

  const port = process.env.LEGAL_GAZETTE_API_PORT || 4100
  await app.listen(port)

  const tmpLogger = new Logger('LegalGazetteAPI')

  tmpLogger.log(
    `🚀 Legal gazette API is running on: http://localhost:${port}/${globalPrefix}/${version}/`,
  )
}

bootstrap()
