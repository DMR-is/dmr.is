/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import {
  BadRequestException,
  Logger,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { SwaggerModule } from '@nestjs/swagger'
import { openApi } from './openApi'
import { apmInit } from '@dmr.is/apm'
import { AppModule } from './app.module'
import {
  JournalAdvertErrorResponse,
  JournalValidationError,
} from './dto/journal-errors'

function exceptionFactory(validationErrors: ValidationError[] = []) {
  const mappedValidationErrors: JournalValidationError[] = validationErrors.map(
    (error) => ({
      field: error.property,
      errors: Object.values(error.constraints ?? {}),
    }),
  )

  const data: JournalAdvertErrorResponse = {
    statusCode: 400,
    error: 'Bad Request',
    validationErrors: mappedValidationErrors,
  }

  const customBody = BadRequestException.createBody(
    // Explicit cast from typed class to record
    data as unknown as Record<string, unknown>,
  )
  return new BadRequestException(customBody)
}

async function bootstrap() {
  const globalPrefix = 'api'
  const swaggerPath = 'swagger'

  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory,
    }),
  )
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
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  )
}

bootstrap()
