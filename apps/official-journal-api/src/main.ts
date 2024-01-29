/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { SwaggerModule } from '@nestjs/swagger'
import { JournalModule } from './app/journal.module'
import { openApi } from './openApi'

async function bootstrap() {
  const globalPrefix = 'api'
  const swaggerPath = 'swagger'

  const app = await NestFactory.create(JournalModule)

  app.setGlobalPrefix(globalPrefix)
  app.enableCors()
  app.enableVersioning({
    type: VersioningType.URI,
  })

  const document = SwaggerModule.createDocument(app, openApi)
  SwaggerModule.setup(swaggerPath, app, document)

  const port = process.env.PORT || 3000
  await app.listen(port)
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  )
}

bootstrap()
