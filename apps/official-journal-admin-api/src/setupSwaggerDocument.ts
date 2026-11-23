import { INestApplication } from '@nestjs/common'
import { SwaggerModule } from '@nestjs/swagger'

import { openApi } from './openApi'

/**
 * The OpenAPI document this API serves at `/swagger`. Shared by `main.ts` and
 * `client-config-drift.spec.ts`, so the drift check builds exactly what
 * production serves.
 */
export const buildSwaggerDocument = (app: INestApplication) =>
  SwaggerModule.createDocument(app, openApi, {
    autoTagControllers: false,
  })
