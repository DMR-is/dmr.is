import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export type SetupSwaggerOptions = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  modules: Function[]
  tag: string
  swaggerTitle: string
  swaggerDescription: string
  swaggerPath: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterPaths?: (path: Record<string, any>) => Record<string, any>
  autoTagControllers?: boolean
}

/**
 * Builds the exact document `setupSwaggerDocument` serves, without mounting it.
 *
 * Split out so `swagger-coverage.spec.ts` can assert on the served artifact
 * rather than on its own re-implementation of this function. That distinction is
 * load-bearing: `filterPaths` runs *after* `createDocument`, so a spec that only
 * called `createDocument` would not see paths this function removes — and
 * `filterPaths` is one config edit away from hiding a whole flow from the
 * generated client.
 */
export const buildSwaggerDocument = (
  app: INestApplication,
  options: SetupSwaggerOptions,
) => {
  const openApi = new DocumentBuilder()
    .setTitle(options.swaggerTitle)
    .setDescription(options.swaggerDescription)
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, openApi, {
    deepScanRoutes: true,
    include: options.modules,
    autoTagControllers: options.autoTagControllers ?? false,
  })

  if (options.filterPaths) {
    document.paths = options.filterPaths(document.paths)
  }

  if (!options.autoTagControllers) {
    document.tags = [{ name: options.tag }]

    // tag routes
    Object.values(document.paths).forEach((path) => {
      for (const method of Object.values(path)) {
        method.tags = [options.tag]
      }
    })
  }

  return document
}

export const setupSwaggerDocument = (
  app: INestApplication,
  options: SetupSwaggerOptions,
) => {
  const document = buildSwaggerDocument(app, options)

  SwaggerModule.setup(options.swaggerPath, app, document, {
    customSiteTitle: options.swaggerTitle,
    jsonDocumentUrl: `/${options.swaggerPath}/json`,
  })
}
