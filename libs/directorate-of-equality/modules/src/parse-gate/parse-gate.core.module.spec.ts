import { Inject, Injectable, Module } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import {
  DEFAULT_MAX_CONCURRENT_PARSES,
  DEFAULT_MAX_QUEUED_PARSES,
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

const buildWithEnv = async (env: Record<string, string | undefined>) => {
  const saved = { ...process.env }
  Object.assign(process.env, env)
  try {
    const moduleRef = await Test.createTestingModule({
      imports: [ParseGateCoreModule],
    }).compile()
    return moduleRef.get<Semaphore>(PARSE_GATE)
  } finally {
    process.env = saved
  }
}

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
      expect(DEFAULT_MAX_QUEUED_PARSES).toBeGreaterThan(0)
      releases.forEach((r) => r())
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
})
