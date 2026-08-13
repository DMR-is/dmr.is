import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

import { DoeApplicationSwaggerModule } from './doe-application.swagger.module'
import { DoeWebSwaggerModule } from './doe-web.swagger.module'

/**
 * Guards the published swagger surface against the failure mode that hid the
 * whole draft-report flow from the island.is client: a controller wired into
 * `AppModule` (so its routes answer) but absent from every `SWAGGER_CONFIG`
 * document (so no client method is ever generated for it). Nothing else in the
 * build notices — the routes work, the tests pass, and the consumer simply has
 * no way to call them.
 *
 * The two swagger aggregates are the runtime registration points in
 * `AppModule`, so reachability from them is the same thing as being routed.
 * Every controller in the tree must therefore be reachable from one of them, or
 * be listed in `UNEXPOSED` with a reason.
 */

/** Nest stores `@Module({ imports, controllers })` under these metadata keys. */
const IMPORTS = 'imports'
const CONTROLLERS = 'controllers'

/** A dynamic module — `SequelizeModule.forFeature([...])` and friends. */
type DynamicModuleRef = { module?: unknown; imports?: unknown[] }

const asDynamicModule = (entry: unknown): DynamicModuleRef | null =>
  entry !== null && typeof entry === 'object' ? (entry as DynamicModuleRef) : null

/**
 * Controllers that are deliberately not in any published document.
 *
 * The three `Report*` entries are api modules that no module imports at all —
 * their routes are not registered and their operations appear nowhere else in
 * the repo. They are superseded by the admin-report / application surfaces and
 * are kept (not deleted) pending a decision on the flows they were built for.
 * Listing them here is the decision record: adding one back to a swagger
 * aggregate is what publishes it.
 */
const UNEXPOSED = new Set([
  // Infrastructure probe, intentionally undocumented.
  'HealthController',
  // Unreferenced api modules — see note above.
  'ReportCreateController',
  'ReportExcelController',
  'ReportResultController',
])

/** Walks a module's `imports` graph and collects every controller class name. */
const reachableControllers = (root: unknown): Set<string> => {
  const found = new Set<string>()
  const seen = new Set<unknown>()
  const queue: unknown[] = [root]

  while (queue.length > 0) {
    const entry = queue.shift()
    // `SequelizeModule.forFeature([...])` and friends are dynamic modules —
    // `{ module, imports, ... }` objects rather than decorated classes.
    const dynamic = asDynamicModule(entry)
    const target = dynamic?.module ?? entry

    if (typeof target !== 'function' || seen.has(target)) {
      continue
    }
    seen.add(target)

    const controllers: unknown[] =
      Reflect.getMetadata(CONTROLLERS, target) ?? []
    for (const controller of controllers) {
      if (typeof controller === 'function') {
        found.add(controller.name)
      }
    }

    for (const imported of (Reflect.getMetadata(IMPORTS, target) ??
      []) as unknown[]) {
      queue.push(imported)
    }
    // Dynamic modules can carry their own imports alongside `module`.
    for (const imported of dynamic?.imports ?? []) {
      queue.push(imported)
    }
  }

  return found
}

/** Every `*.controller.ts` class in the app, read off disk rather than imported. */
const declaredControllers = (): Set<string> => {
  const root = join(__dirname, '..', '..')
  const names = new Set<string>()

  const walk = (dir: string) => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, item.name)
      if (item.isDirectory()) {
        walk(path)
      } else if (
        item.name.endsWith('.controller.ts') &&
        !item.name.endsWith('.spec.ts')
      ) {
        const source = readFileSync(path, 'utf-8')
        for (const match of source.matchAll(
          /export class (\w*Controller)\b/g,
        )) {
          names.add(match[1])
        }
      }
    }
  }

  walk(root)
  return names
}

describe('swagger document coverage', () => {
  const applicationDoc = reachableControllers(DoeApplicationSwaggerModule)
  const internalDoc = reachableControllers(DoeWebSwaggerModule)

  it('finds the controllers on disk', () => {
    // Sanity check on the disk walk itself — an empty set would make every
    // assertion below vacuously true.
    expect(declaredControllers().size).toBeGreaterThan(10)
  })

  it('publishes every controller in the tree, or records why not', () => {
    const published = new Set([...applicationDoc, ...internalDoc])

    const undocumented = [...declaredControllers()].filter(
      (name) => !published.has(name) && !UNEXPOSED.has(name),
    )

    expect(undocumented).toEqual([])
  })

  it('serves the whole applicant surface from the application document', () => {
    // Both share the `application/v1` prefix and the company-auth boundary;
    // the draft controller is the one the application system depends on to
    // hold report content it cannot store itself.
    expect([...applicationDoc].sort()).toEqual([
      'ApplicationController',
      'ReportDraftController',
    ])
  })

  it('keeps the applicant and admin surfaces disjoint', () => {
    // An admin-guarded controller leaking into the applicant document would
    // publish reviewer-only operations to island.is.
    const overlap = [...applicationDoc].filter((name) => internalDoc.has(name))

    expect(overlap).toEqual([])
  })
})
