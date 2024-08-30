/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { WinstonModule } from 'nest-winston'
import { apmInit } from '@dmr.is/apm'
import { logger } from '@dmr.is/logging'

import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app/app.module'
import { openApi } from './openApi'

async function bootstrap() {
  const globalPrefix = 'api'
  const swaggerPath = 'swagger'

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
  })

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory(errors) {
        const errs = errors.map((error) => {
          const target = error.target?.constructor.name
          logger.warn(
            `Application API validation error: ${target}.${error.property} received<${error.value}>`,
            {
              constraints: error.constraints,
              children: error.children,
            },
          )

          return {
            property: error.property,
            constraints: error.constraints,
          }
        })
        return new BadRequestException(errs)
      },
      transform: true,
      // stopAtFirstError: true,
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

  const port = process.env.APPLICATION_PORT || 5000
  await app.listen(port)
  logger.info(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  )
}

bootstrap()
