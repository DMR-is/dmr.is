import { INestApplication } from '@nestjs/common'
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger'

type SetupSwaggerOptions = {
  modules: Function[]
  tag: string
  swaggerTitle: string
  swaggerPath: string
  filterPaths?: (path: Record<string, any>) => Record<string, any>
}

export const setupSwaggerDocument = (
  app: INestApplication,
  openApi: Omit<OpenAPIObject, 'paths'>,
  options: SetupSwaggerOptions,
) => {
  const document = SwaggerModule.createDocument(app, openApi, {
    deepScanRoutes: true,
    include: options.modules,
    autoTagControllers: true,
  })

  document.tags = [{ name: options.tag }]

  if (options.filterPaths) {
    document.paths = options.filterPaths(document.paths)
  } else {
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
