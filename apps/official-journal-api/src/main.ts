/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { SwaggerModule } from '@nestjs/swagger'
import { JournalModule } from './app/journal.module'
import { openApi } from './openApi'
import { apmInit } from '@dmr.is/apm'
import { JournalSignatureRegular } from './dto/signatures/regular/journal-signature-regular.dto'
import { JournalSignatureCommittee } from './dto/signatures/committee/journal-signature-committee.dto'

async function bootstrap() {
  const globalPrefix = 'api'
  const swaggerPath = 'swagger'

  const app = await NestFactory.create(JournalModule)

  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.setGlobalPrefix(globalPrefix)
  app.enableCors()
  app.enableVersioning({
    type: VersioningType.URI,
  })

  const document = SwaggerModule.createDocument(app, openApi, {
    extraModels: [JournalSignatureCommittee, JournalSignatureRegular],
  })
  SwaggerModule.setup(swaggerPath, app, document)

  apmInit()

  const port = process.env.PORT || 3000
  await app.listen(port)
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  )
}

bootstrap()
