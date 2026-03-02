import { INestApplication } from '@nestjs/common'
import { SwaggerModule } from '@nestjs/swagger'

import { BaseEntityDto } from './modules/base-entity/dto/base-entity.dto'
import { openApi } from './openApi'

export type SetupSwaggerOptions = {
  modules: Function[]
  tag: string
  swaggerTitle: string
  swaggerPath: string
  filterPaths?: (path: Record<string, any>) => Record<string, any>
  autoTagControllers?: boolean
}

export const setupSwaggerDocument = (
  app: INestApplication,
  options: SetupSwaggerOptions,
) => {
  const document = SwaggerModule.createDocument(app, openApi, {
    deepScanRoutes: true,
    include: options.modules,
    extraModels: [BaseEntityDto],
    autoTagControllers: options.autoTagControllers ?? false,
  })

  document.tags = [{ name: options.tag }]

  if (options.filterPaths) {
    document.paths = options.filterPaths(document.paths)
  }

  if (!options.autoTagControllers) {
    // tag routes
    Object.values(document.paths).forEach((path) => {
      for (const method of Object.values(path)) {
        method.tags = [options.tag]
      }
    })
  }

  SwaggerModule.setup(options.swaggerPath, app, document, {
    customSiteTitle: options.swaggerTitle,
    jsonDocumentUrl: `/${options.swaggerPath}/json`,
  })
}
