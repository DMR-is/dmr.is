import { readdirSync, readFileSync } from 'fs'
import { join, relative } from 'path'

import { Inject, Injectable, Module } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyImportCoreModule } from '../company-import/company-import.core.module'
import { ReportExcelCoreModule } from '../report-excel/report-excel.core.module'
import {
  DEFAULT_MAX_CONCURRENT_PARSES,
  DEFAULT_MAX_QUEUED_PARSES,
  PARSE_GATE_CONFIG_REJECTED,
  ParseGateCoreModule,
} from './parse-gate.core.module'
import { PARSE_GATE } from './parse-gate.token'
import { Semaphore } from './semaphore'

/**
 * Two consumers standing in for `ReportExcelService` and
 * `CompanyImportService` — the shape that matters is two services in two
 * independent modules each injecting the gate, not those two specifically.
 *
 * Asserting on what the *services* receive, rather than on what the module
 * registry holds, is deliberate: the failure this guards against is two
 * services ending up with two gates, and only the injected value can show
 * that.
 */
@Injectable()
class FirstConsumer {
  constructor(@Inject(PARSE_GATE) readonly gate: Semaphore) {}
}

@Injectable()
class SecondConsumer {
  constructor(@Inject(PARSE_GATE) readonly gate: Semaphore) {}
}

@Module({ imports: [ParseGateCoreModule], providers: [FirstConsumer] })
class FirstConsumerModule {}

@Module({ imports: [ParseGateCoreModule], providers: [SecondConsumer] })
class SecondConsumerModule {}

/**
 * Two things this deliberately does NOT do, both verified in Node rather than
 * assumed:
 *
 * `Object.assign(process.env, { X: undefined })` stores the *string*
 * `"undefined"`, not an absent key — so it would exercise the malformed-value
 * branch while claiming to test the unset one, and `readInt`'s
 * `raw === undefined` guard would have no coverage at all. Unset means
 * `delete`.
 *
 * `process.env = saved` swaps Node's env for a plain object and permanently
 * disables its string coercion for the rest of the worker, which Jest shares
 * across files. Restore key by key.
 */
const withEnv = async <T>(
  env: Record<string, string | undefined>,
  run: () => Promise<T>,
): Promise<T> => {
  const keys = Object.keys(env)
  const saved = new Map(keys.map((k) => [k, process.env[k]]))

  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }

  try {
    return await run()
  } finally {
    for (const [k, v] of saved) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  }
}

const buildWithEnv = (env: Record<string, string | undefined>) =>
  withEnv(env, async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ParseGateCoreModule],
    }).compile()
    return moduleRef.get<Semaphore>(PARSE_GATE)
  })

/**
 * The same build with the logger replaced, so the init line can be asserted.
 *
 * `ParseGateCoreModule` imports `LoggingModule` rather than relying on its
 * `@Global()` registration precisely so this compiles standalone; overriding
 * the provider is then the ordinary Nest testing path rather than a fixture
 * that has to reconstruct the app.
 */
const buildWithLogger = (env: Record<string, string | undefined>) =>
  withEnv(env, async () => {
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
    const moduleRef = await Test.createTestingModule({
      imports: [ParseGateCoreModule],
    })
      .overrideProvider(LOGGER_PROVIDER)
      .useValue(logger)
      .compile()
    return { gate: moduleRef.get<Semaphore>(PARSE_GATE), logger }
  })

describe('ParseGateCoreModule', () => {
  describe('one gate for the process', () => {
    /**
     * The property the whole module exists for. If two importers each get
     * their own `Semaphore`, both still look correctly bounded in isolation
     * while the process runs at twice the concurrency the budget in
     * `import-upload/archive-budget.ts` is derived from. Nothing else in the
     * codebase would fail — which is why it is pinned here.
     */
    it('hands the same instance to two services in different modules', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [FirstConsumerModule, SecondConsumerModule],
      }).compile()

      const first = moduleRef.get(FirstConsumer, { strict: false })
      const second = moduleRef.get(SecondConsumer, { strict: false })

      expect(first.gate).toBeInstanceOf(Semaphore)
      expect(first.gate).toBe(second.gate)
    })

    /**
     * `toBe` above would also pass if both resolutions were somehow reading
     * one module's provider by accident, so prove the identity is real by
     * observing shared state: a slot taken through one reference has to be
     * visible through the other.
     */
    it('lets one service exhaust the slots the other would use', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [FirstConsumerModule, SecondConsumerModule],
      }).compile()

      const first = moduleRef.get(FirstConsumer, { strict: false })
      const second = moduleRef.get(SecondConsumer, { strict: false })

      // Take every slot through one service...
      const releases = []
      for (let i = 0; i < DEFAULT_MAX_CONCURRENT_PARSES; i++) {
        releases.push(await first.gate.acquire())
      }

      // ...and the other must see none left, rather than getting its own set.
      expect(second.gate.activeCount).toBe(DEFAULT_MAX_CONCURRENT_PARSES)
      let acquired = false
      void second.gate.acquire().then(() => {
        acquired = true
      })
      await Promise.resolve()
      expect(acquired).toBe(false)
      expect(second.gate.queuedCount).toBe(1)

      releases.forEach((r) => r())
    })
  })

  describe('the real modules, not stand-ins', () => {
    /**
     * The tests above use synthetic consumer modules, which means a mutation
     * that removes `ParseGateCoreModule` from a *real* core module and drops
     * in its own `PARSE_GATE` provider leaves them all green while the process
     * quietly runs at double the concurrency the budget is derived from.
     *
     * Asserted on the modules' own metadata rather than by booting them: both
     * pull in Sequelize models and a logger, and standing that up would test
     * the fixture more than the wiring. What matters is exactly this — each
     * core module takes the gate from the shared provider, and neither
     * declares one of its own.
     */
    const importsOf = (target: unknown): Array<unknown> =>
      Reflect.getMetadata('imports', target as object) ?? []

    const providersOf = (target: unknown): Array<unknown> =>
      Reflect.getMetadata('providers', target as object) ?? []

    it.each([
      ['CompanyImportCoreModule', CompanyImportCoreModule],
      ['ReportExcelCoreModule', ReportExcelCoreModule],
    ])('%s takes the gate from the shared provider', (_name, mod) => {
      expect(importsOf(mod)).toContain(ParseGateCoreModule)
    })

    it.each([
      ['CompanyImportCoreModule', CompanyImportCoreModule],
      ['ReportExcelCoreModule', ReportExcelCoreModule],
    ])('%s does not provide a gate of its own', (_name, mod) => {
      const ownGate = providersOf(mod).some(
        (p) =>
          typeof p === 'object' &&
          p !== null &&
          (p as { provide?: unknown }).provide === PARSE_GATE,
      )
      expect(ownGate).toBe(false)
    })
  })

  /**
   * The hand-maintained `it.each` above names the two modules that exist today.
   * It cannot catch a *third* consumer declaring its own `PARSE_GATE`, which is
   * exactly the failure this module exists to prevent — two gates of 2 permit
   * four concurrent workbooks and ~1040MB against a 1152MB heap, while every
   * module still reads as correctly bounded on its own.
   *
   * A text scan rather than importing all 28 core modules: importing them pulls
   * Sequelize models and app wiring, and buys nothing this does not.
   */
  describe('no other module may provide the gate', () => {
    it('is the only core module declaring PARSE_GATE', () => {
      const modulesDir = join(__dirname, '..')
      const offenders = readdirSync(modulesDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .flatMap((dir) =>
          readdirSync(join(modulesDir, dir.name))
            .filter((f) => f.endsWith('.core.module.ts'))
            .map((f) => join(modulesDir, dir.name, f)),
        )
        .filter((file) => {
          const src = readFileSync(file, 'utf8')
          // `provide: PARSE_GATE` is the declaration; importing the module or
          // injecting the token is what consumers are supposed to do.
          return /provide:\s*PARSE_GATE/.test(src)
        })
        .map((file) => relative(modulesDir, file))

      expect(offenders).toEqual(['parse-gate/parse-gate.core.module.ts'])
    })
  })

  describe('environment', () => {
    it('runs on defaults when nothing is set, so infra need not supply them', async () => {
      const gate = await buildWithEnv({
        DOE_EXCEL_MAX_CONCURRENT_PARSES: undefined,
        DOE_EXCEL_MAX_QUEUED_PARSES: undefined,
      })

      const releases = []
      for (let i = 0; i < DEFAULT_MAX_CONCURRENT_PARSES; i++) {
        releases.push(await gate.acquire())
      }
      expect(gate.activeCount).toBe(DEFAULT_MAX_CONCURRENT_PARSES)

      // `expect(DEFAULT_MAX_QUEUED_PARSES).toBeGreaterThan(0)` stood here and
      // asserted a constant against itself — it passed with the gate built at
      // any queue depth, including the ceiling of 200 while the log reported
      // 20. Fill the queue to the default and prove the next caller is shed.
      const queued = []
      for (let i = 0; i < DEFAULT_MAX_QUEUED_PARSES; i++) {
        queued.push(gate.acquire())
      }
      await Promise.resolve()
      expect(gate.queuedCount).toBe(DEFAULT_MAX_QUEUED_PARSES)
      await expect(gate.acquire()).rejects.toThrow(/queue is full/i)

      // Drain sequentially. `release` hands its slot straight to the next
      // waiter rather than decrementing, so releasing the two active slots
      // wakes exactly two waiters — `Promise.all` on the rest would hang.
      releases.forEach((r) => r())
      for (const pending of queued) {
        ;(await pending)()
      }
    })

    it('honours an override', async () => {
      const gate = await buildWithEnv({
        DOE_EXCEL_MAX_CONCURRENT_PARSES: '3',
        DOE_EXCEL_MAX_QUEUED_PARSES: '5',
      })

      const releases = [
        await gate.acquire(),
        await gate.acquire(),
        await gate.acquire(),
      ]
      expect(gate.activeCount).toBe(3)
      releases.forEach((r) => r())
    })

    /**
     * A floor alone would accept any large integer. `64` is valid input and
     * implies ~16GB of worst-case parse heap against a 1152MB ceiling, so one
     * task-definition typo would defeat the module entirely and silently.
     *
     * `0x10` and `1e3` are here because `Number` accepts both (16 and 1000);
     * the digits-only test is what rejects them.
     */
    it.each([['64'], ['1000'], ['0x10'], ['1e3']])(
      'ignores the out-of-range or non-decimal value %p and keeps the default',
      async (raw) => {
        // Both vars are pinned, never just the one under test. Neither is set
        // in any environment today, but a test that reads whatever the shell
        // happens to export fails for a reason it does not name.
        const gate = await buildWithEnv({
          DOE_EXCEL_MAX_CONCURRENT_PARSES: raw,
          DOE_EXCEL_MAX_QUEUED_PARSES: undefined,
        })

        const releases = []
        for (let i = 0; i < DEFAULT_MAX_CONCURRENT_PARSES; i++) {
          releases.push(await gate.acquire())
        }

        // Taking the default number of slots proves nothing on its own — with
        // a limit of 64 the counts look identical. The limit only shows itself
        // on the request *past* it, which must queue rather than resolve.
        let extraResolved = false
        void gate
          .acquire()
          .then(() => {
            extraResolved = true
          })
          // Without this an unexpected rejection becomes an unhandled promise
          // rejection that Jest attributes to whatever runs next.
          .catch(() => undefined)
        await Promise.resolve()
        expect(extraResolved).toBe(false)
        expect(gate.queuedCount).toBe(1)

        releases.forEach((r) => r())
      },
    )

    /**
     * `Number('two')` is `NaN`, and `NaN` slips past the constructor's `< 1`
     * guard while making every `active < maxConcurrent` comparison false — so
     * an unparseable value would not throw, it would queue every parse and
     * then shed the lot with a 503. Falling back has to be the behaviour.
     */
    it.each([['two'], ['0'], ['-1'], ['1.5'], ['']])(
      'ignores the unusable concurrency value %p and keeps the default',
      async (raw) => {
        const gate = await buildWithEnv({
          DOE_EXCEL_MAX_CONCURRENT_PARSES: raw,
          DOE_EXCEL_MAX_QUEUED_PARSES: undefined,
        })

        const releases = []
        for (let i = 0; i < DEFAULT_MAX_CONCURRENT_PARSES; i++) {
          releases.push(await gate.acquire())
        }
        expect(gate.activeCount).toBe(DEFAULT_MAX_CONCURRENT_PARSES)
        releases.forEach((r) => r())
      },
    )

    it('accepts a queue length of zero, which sheds instead of queueing', async () => {
      const gate = await buildWithEnv({
        DOE_EXCEL_MAX_CONCURRENT_PARSES: '1',
        DOE_EXCEL_MAX_QUEUED_PARSES: '0',
      })

      const release = await gate.acquire()
      await expect(gate.acquire()).rejects.toThrow(/queue is full/i)
      release()
    })
  })

  /**
   * A discarded override used to leave no trace at all. The gate ran at its
   * default, and the only observable was `activeParses` inside a shed warning
   * that appears once the gate is already saturated — which is both too late
   * and the wrong signal for "the task definition was ignored".
   */
  describe('reports its effective configuration', () => {
    it('logs the pair the budget is derived from', async () => {
      const { logger } = await buildWithLogger({
        DOE_EXCEL_MAX_CONCURRENT_PARSES: undefined,
        DOE_EXCEL_MAX_QUEUED_PARSES: undefined,
      })

      expect(logger.info).toHaveBeenCalledWith(
        'Parse gate configured',
        expect.objectContaining({
          maxConcurrentParses: DEFAULT_MAX_CONCURRENT_PARSES,
          maxQueuedParses: DEFAULT_MAX_QUEUED_PARSES,
        }),
      )
    })

    /**
     * Unset is the normal deployment, not a mistake — nothing in the
     * infrastructure repo sets either variable. Reporting it as a rejected
     * override would make the ordinary case look like a misconfiguration and
     * train the reader to ignore the field.
     */
    it('does not call an unset variable a rejected override', async () => {
      const { logger } = await buildWithLogger({
        DOE_EXCEL_MAX_CONCURRENT_PARSES: undefined,
        DOE_EXCEL_MAX_QUEUED_PARSES: undefined,
      })

      const [, meta] = logger.info.mock.calls[0]
      expect(meta).not.toHaveProperty('rejectedOverrides')
    })

    /**
     * The value that motivated this: `64` is a valid positive integer that
     * falls back to 2, not to the ceiling of 8. Without the raw value in the
     * log there is nothing anywhere to say the deployment asked for something
     * else and did not get it.
     */
    it('names the rejected override and the value actually in force', async () => {
      const { logger } = await buildWithLogger({
        DOE_EXCEL_MAX_CONCURRENT_PARSES: '64',
        DOE_EXCEL_MAX_QUEUED_PARSES: undefined,
      })

      expect(logger.info).toHaveBeenCalledWith(
        'Parse gate configured',
        expect.objectContaining({
          maxConcurrentParses: DEFAULT_MAX_CONCURRENT_PARSES,
          rejectedOverrides: ['DOE_EXCEL_MAX_CONCURRENT_PARSES=64'],
        }),
      )
    })

    /**
     * The info line records what the container runs at; it is emitted on every
     * boot and so cannot be alerted on. A discarded task-definition value is an
     * anomaly, and every other anomaly in this scope carries a level and an
     * `errorCode` for exactly that reason — `EXCEL_IMPORT_BUSY`,
     * `COMPANY_IMPORT_BUSY`, `EXCEL_IMPORT_VALIDATION_FAILED`.
     */
    it('warns under a facetable marker when it discards an override', async () => {
      const { logger } = await buildWithLogger({
        DOE_EXCEL_MAX_CONCURRENT_PARSES: '64',
        DOE_EXCEL_MAX_QUEUED_PARSES: undefined,
      })

      expect(logger.warn).toHaveBeenCalledWith(
        'Parse gate ignored a configured value',
        expect.objectContaining({
          errorCode: PARSE_GATE_CONFIG_REJECTED,
          rejectedOverrides: ['DOE_EXCEL_MAX_CONCURRENT_PARSES=64'],
        }),
      )
    })

    /** A normal boot must be silent at warn, or the marker means nothing. */
    it('does not warn when every value is accepted', async () => {
      const { logger } = await buildWithLogger({
        DOE_EXCEL_MAX_CONCURRENT_PARSES: '3',
        DOE_EXCEL_MAX_QUEUED_PARSES: '10',
      })

      expect(logger.warn).not.toHaveBeenCalled()
    })
  })
})
