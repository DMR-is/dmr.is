import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { applyApiRouting } from '../../api-routing'
import { AppModule } from '../../app/app.module'
import { PUBLIC_ROUTE_METADATA } from '../../core/decorators/public-route.decorator'
import { API_SCOPE_METADATA } from '../../core/guards/api-key-scope/require-api-scope.decorator'
import { declaresAccess } from '../../core/guards/declared-access/declared-access.guard'
import { buildSwaggerDocument } from '../../setupSwaggerDocument'
import { SWAGGER_CONFIG } from '../../swagger.config'

/**
 * Controllers allowed to answer without a credential. Anything here is served to
 * the open internet.
 */
const PUBLIC_ROUTE_ALLOWLIST: ReadonlySet<string> = new Set(['HealthController'])

const GUARDS_METADATA = '__guards__'

// eslint-disable-next-line @typescript-eslint/ban-types
const guardsForHandler = (controller: Function, method: string): unknown[] => [
  ...((Reflect.getMetadata(
    GUARDS_METADATA,
    (controller.prototype as Record<string, unknown>)[method] as object,
  ) as unknown[]) ?? []),
  ...((Reflect.getMetadata(GUARDS_METADATA, controller) as unknown[]) ?? []),
]

/** Every routed handler as [controller, methodName]. */
// eslint-disable-next-line @typescript-eslint/ban-types
const routedHandlers = (app: INestApplication): Array<[Function, string]> => {
  const modules = (
    app as unknown as {
      container: { getModules: () => Map<unknown, { controllers: Map<unknown, { metatype: Function }> }> }
    }
  ).container.getModules()

  const out: Array<[Function, string]> = []

  for (const module of modules.values()) {
    for (const wrapper of module.controllers.values()) {
      const controller = wrapper.metatype
      if (!controller?.prototype) continue

      for (const name of Object.getOwnPropertyNames(controller.prototype)) {
        if (name === 'constructor') continue
        const handler = (controller.prototype as Record<string, unknown>)[name]
        if (typeof handler !== 'function') continue
        // A routed handler carries a path; anything else is a helper.
        if (Reflect.getMetadata('path', handler as object) === undefined) continue
        out.push([controller, name])
      }
    }
  }

  return out
}

const publicReason = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  controller: Function,
  method: string,
): string | undefined =>
  (Reflect.getMetadata(
    PUBLIC_ROUTE_METADATA,
    (controller.prototype as Record<string, unknown>)[method] as object,
  ) as string | undefined) ??
  (Reflect.getMetadata(PUBLIC_ROUTE_METADATA, controller) as string | undefined)

const requiredScope = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  controller: Function,
  method: string,
): string | undefined =>
  (Reflect.getMetadata(
    API_SCOPE_METADATA,
    (controller.prototype as Record<string, unknown>)[method] as object,
  ) as string | undefined) ??
  (Reflect.getMetadata(API_SCOPE_METADATA, controller) as string | undefined)

describe('partner surface coverage', () => {
  let app: INestApplication

  beforeAll(async () => {
    // `preview: true` builds the module graph and registers routes without
    // instantiating providers — which is what makes this runnable with no
    // database, and also why the throttler's onModuleInit is never reached.
    // Same arrangement as swagger-coverage.spec.ts on the sibling app.
    app = await NestFactory.create(AppModule, { preview: true, logger: false })
    applyApiRouting(app)
    await app.init()
  })

  afterAll(async () => {
    await app?.close()
  })

  it('declares an access policy for every routed handler', () => {
    const undeclared = routedHandlers(app)
      .filter(([controller, method]) => !publicReason(controller, method))
      .filter(
        ([controller, method]) =>
          !declaresAccess(guardsForHandler(controller, method)),
      )
      .map(([controller, method]) => `${controller.name}.${method}`)

    expect(undeclared).toEqual([])
  })

  it('exposes no unauthenticated handler outside the allowlist', () => {
    const unlisted = routedHandlers(app)
      .filter(([controller, method]) => publicReason(controller, method))
      .filter(([controller]) => !PUBLIC_ROUTE_ALLOWLIST.has(controller.name))
      .map(([controller, method]) => `${controller.name}.${method}`)

    expect(unlisted).toEqual([])
  })

  it('narrows every authenticated handler by scope', () => {
    // Specific to a public surface. A handler that declares no scope accepts
    // any key the company ever issued, which silently defeats the point of
    // letting a company narrow one.
    //
    // Asserts on the metadata `@RequireApiScope` sets, NOT on whether
    // `RequireApiScopeGuard` is in the chain. The first version of this test did
    // the latter and was vacuous: the guard sits at class level, so it is
    // present whether or not any handler declares a scope. Mutation-tested by
    // removing a `@RequireApiScope` — which the guard-presence version passed.
    const unscoped = routedHandlers(app)
      .filter(([controller, method]) => !publicReason(controller, method))
      .filter(([controller, method]) => !requiredScope(controller, method))
      .map(([controller, method]) => `${controller.name}.${method}`)

    expect(unscoped).toEqual([])
  })

  it('publishes every routed operation in the document', () => {
    // The document IS the contract an integrator builds against, so a routed
    // operation missing from it is unusable even though it answers.
    const document = buildSwaggerDocument(app, SWAGGER_CONFIG[0])
    const published = Object.values(document.paths).reduce(
      (total, methods) => total + Object.keys(methods).length,
      0,
    )

    const authenticated = routedHandlers(app).filter(
      ([controller, method]) => !publicReason(controller, method),
    )

    expect(published).toBe(authenticated.length)
  })

  it('guards a substantial surface', () => {
    // Anti-vacuity floor: every assertion above is "no offenders", so an empty
    // handler list would satisfy all of them.
    expect(routedHandlers(app).length).toBeGreaterThan(10)
  })
})
