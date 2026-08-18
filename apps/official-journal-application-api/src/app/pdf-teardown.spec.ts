import { Sequelize } from 'sequelize-typescript'

import { ModulesContainer } from '@nestjs/core'
import { Test } from '@nestjs/testing'

import { AppModule } from './app.module'

/**
 * Nest 11 reverses the order in which termination hooks fire. This app owns the
 * only `OnModuleDestroy` implementation written in this repo -- `PdfService`,
 * which closes the puppeteer browser it keeps alive between renders. Everything
 * else with a teardown hook here comes from a framework package.
 *
 * This file pins the real code, so that if a future bump changes when the
 * browser is closed -- or if a change adds a teardown hook that DOES depend on
 * ordering -- it is visible here.
 *
 * Expectations are labelled CHARACTERIZED (measured against Nest 10) or
 * SPECIFIED (a decision made now).
 */

interface TeardownProbe {
  onModuleDestroy?: () => unknown
  beforeApplicationShutdown?: () => unknown
  onApplicationShutdown?: () => unknown
}

const HOOKS = [
  'onModuleDestroy',
  'beforeApplicationShutdown',
  'onApplicationShutdown',
] as const

const tokenName = (token: unknown): string =>
  typeof token === 'function' ? token.name : String(token)

/** `InstanceWrapper.instance` is untyped; narrow it before probing for hooks. */
const asTeardownProbe = (instance: unknown): TeardownProbe | null =>
  typeof instance === 'object' && instance !== null
    ? (instance as TeardownProbe)
    : null

describe('teardown hooks', () => {
  const order: string[] = []

  const build = async () => {
    return Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Sequelize)
      .useValue({
        repositoryMode: false,
        close: () => {
          order.push('sequelize:close')
          return Promise.resolve()
        },
      })
      .compile()
  }

  beforeEach(() => {
    order.length = 0
  })

  it('has exactly one teardown hook of our own', async () => {
    const testingModule = await build()
    const container = testingModule.get(ModulesContainer)
    const found = new Set<string>()

    for (const module of container.values()) {
      for (const wrapper of module.providers.values()) {
        const instance = asTeardownProbe(wrapper.instance)
        if (!instance) continue
        const hooks = HOOKS.filter(
          (hook) => typeof instance[hook] === 'function',
        )
        if (hooks.length === 0) continue
        found.add(`${tokenName(wrapper.token)}: ${hooks.join(',')}`)
      }
    }

    // CHARACTERIZED: four of these five entries are framework-owned --
    // CACHE_MANAGER and Cache are the same cache-manager instance under two
    // tokens, SchedulerOrchestrator is @nestjs/schedule clearing its timers,
    // SequelizeCoreModule closes the connection. Only IPdfService is ours.
    //
    // SPECIFIED: this list is the guard. A teardown hook added during the Nest
    // 11 upgrade -- or by any later feature -- shows up here and has to be
    // reviewed against the reversed ordering before this expectation is updated.
    expect([...found].sort()).toEqual([
      'CACHE_MANAGER: onModuleDestroy',
      'Cache: onModuleDestroy',
      'SchedulerOrchestrator: onApplicationShutdown',
      'SequelizeCoreModule: onApplicationShutdown',
      'Symbol(IPdfService): onModuleDestroy',
    ])

    await testingModule.close()
  }, 120000)

  it('closes the pdf browser before the database connection', async () => {
    const testingModule = await build()
    const container = testingModule.get(ModulesContainer)

    let pdfService: TeardownProbe | undefined
    for (const module of container.values()) {
      for (const wrapper of module.providers.values()) {
        if (tokenName(wrapper.token) !== 'Symbol(IPdfService)') continue
        pdfService = asTeardownProbe(wrapper.instance) ?? undefined
      }
    }

    expect(pdfService).toBeDefined()
    const original = pdfService?.onModuleDestroy
    expect(typeof original).toBe('function')

    if (pdfService && original) {
      pdfService.onModuleDestroy = () => {
        order.push('pdf:destroy')
        return original.call(pdfService)
      }
    }

    const app = testingModule.createNestApplication()
    await app.init()
    await app.close()

    // CHARACTERIZED: PdfService.onModuleDestroy runs, and it runs before the
    // Sequelize connection is closed -- onModuleDestroy is a strictly earlier
    // phase than onApplicationShutdown, so reversing the module ordering within
    // each phase does not put the database teardown first.
    //
    // PdfService.onModuleDestroy touches only `this.browser`, never an injected
    // provider, so it is indifferent to the Nest 11 reordering. That is why the
    // bump is expected to be safe here; if the hook ever grows a dependency,
    // the guard in the test above is what catches it.
    expect(order).toEqual(['pdf:destroy', 'sequelize:close'])
  }, 120000)
})
