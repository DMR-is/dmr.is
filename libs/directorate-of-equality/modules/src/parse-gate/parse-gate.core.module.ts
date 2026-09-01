/**
 * One parse gate for the whole process.
 *
 * Two modules parse uploaded workbooks — `report-excel` (citizen and admin
 * report imports) and `company-import` (the staff company list) — and both
 * pay the same price for it: `MAX_INFLATED_ARCHIVE_BYTES` of inflated XML
 * times the roughly 8x exceljs retains as an object graph, so about 256MB of
 * heap per parse against a 1152MB ceiling.
 *
 * That is why this is a shared provider and not a field on either service.
 * The budget in `import-upload/archive-budget.ts` is derived as
 * `32MB x 8 x 2 parses = ~520MB`, and the "2" has to mean two parses in the
 * process, not two per importer. A gate on each would allow four concurrent
 * parses and about 1040MB — near the whole ceiling, and the exact arithmetic
 * that made an earlier 64MB budget wrong. Each importer would still look
 * correctly bounded read on its own, which is what makes that failure hard to
 * notice.
 *
 * NestJS providers are singletons per injector, so importing this module from
 * both core modules hands both services the same `Semaphore`.
 */
import { Module } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'

import { PARSE_GATE } from './parse-gate.token'
import { Semaphore } from './semaphore'

const LOGGING_CONTEXT = 'ParseGateCoreModule'

/**
 * Facet on `@errorCode:PARSE_GATE_CONFIG_REJECTED` to catch a task definition
 * whose value was thrown away. Follows the constant-per-marker pattern
 * `EXCEL_IMPORT_BUSY` and `COMPANY_IMPORT_BUSY` use, so a discarded
 * configuration is alertable rather than only greppable.
 */
const PARSE_GATE_CONFIG_REJECTED = 'PARSE_GATE_CONFIG_REJECTED'

/**
 * The outcome of reading one variable: the value the gate will use, plus the
 * raw string when an override was present and refused.
 *
 * `rejected` exists so the factory can say so out loud. A discarded override
 * is otherwise invisible — the gate simply runs at its default, and the only
 * trace is `activeParses` inside a shed warning that appears only once the
 * gate is already saturated, which is the wrong moment to discover that a task
 * definition was ignored.
 */
type EnvInt = { value: number; rejected?: string }

/**
 * Read a positive integer from the environment, falling back when it is unset
 * or unusable.
 *
 * Unset is the normal case: neither variable is declared required, so nothing
 * has to be added to a task definition before this ships. The fallbacks are
 * the operating values, not placeholders — so unset is not reported as a
 * rejection, only a value that was supplied and refused is.
 *
 * A malformed value falls back rather than propagating. `Number('two')` is
 * `NaN`, and `NaN` passes the constructor's `< 1` check while making every
 * `active < maxConcurrent` comparison false — so a typo would not throw, it
 * would wedge every parse in the queue until the queue filled and then shed
 * everything with a 503. Failing back to a working default beats failing into
 * that.
 *
 * Note the refusal is to the *default*, not to the nearest bound. An
 * out-of-range value means somebody's intent and this module's budget
 * disagree; clamping to the ceiling would silently grant most of what was
 * asked for, where falling back to 2 and logging it does not.
 */
const readInt = (
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): EnvInt => {
  if (raw === undefined) return { value: fallback }

  // Digits only, deliberately narrower than `Number`. `Number('0x10')` is 16
  // and `Number('1e3')` is 1000 — both are whole numbers in range, so every
  // check below would pass a value nobody meant to write.
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return { value: fallback, rejected: raw }

  const parsed = Number(trimmed)
  return parsed >= min && parsed <= max
    ? { value: parsed }
    : { value: fallback, rejected: raw }
}

/**
 * Concurrent parses allowed across both importers. Named for Excel rather
 * than for either module because it predates the second consumer and is
 * likely already set in a task definition; renaming it would silently drop
 * whatever value is deployed.
 */
export const DEFAULT_MAX_CONCURRENT_PARSES = 2

/** Callers allowed to wait for a slot before further uploads are shed. */
export const DEFAULT_MAX_QUEUED_PARSES = 20

/**
 * Ceilings, so a typo cannot quietly defeat the thing this module exists for.
 *
 * A floor alone is not enough: `DOE_EXCEL_MAX_CONCURRENT_PARSES=64` is a
 * perfectly valid positive integer that implies ~16GB of worst-case parse heap
 * against a 1152MB ceiling. Anything above these is treated as a mistake and
 * the default is used instead, which is the safe direction to fail.
 *
 * 8 is already well past what the heap supports; it exists so a deliberate,
 * considered bump does not require a code change, not as a usable setting.
 *
 * The queue ceiling is loose for a different reason, and it is worth stating
 * rather than leaving as a bare number. Waiting is cheap: a queued caller holds
 * its pending HTTP request and nothing else, because the workbook is downloaded
 * *inside* the gated region rather than before it (see
 * `import-upload/archive-budget.ts`). 200 waiting requests are therefore a
 * queueing-theory question — how long a client should sit before a 503 is
 * kinder than a timeout — not a heap one.
 *
 * That was not true while the controllers downloaded first: each queued caller
 * then held up to 20MB, so 200 would have implied ~4GB against a 1152MB heap.
 * If the download is ever hoisted back out of the gate, this number becomes
 * indefensible and has to come down with it.
 */
const MAX_ALLOWED_CONCURRENT_PARSES = 8
const MAX_ALLOWED_QUEUED_PARSES = 200

@Module({
  // `LoggingModule` is `@Global()`, so the app resolves `LOGGER_PROVIDER`
  // without this. It is imported anyway so the module carries its own
  // dependency: `Test.createTestingModule({ imports: [ParseGateCoreModule] })`
  // has no global registry, and a module that only compiles inside a full app
  // is one nobody writes a test for.
  imports: [LoggingModule],
  providers: [
    {
      provide: PARSE_GATE,
      // A factory rather than a module-scope constant: this reads the
      // environment when the module is instantiated, not when the file is
      // first imported, which is the difference between seeing a variable and
      // missing it.
      useFactory: (logger: Logger): Semaphore => {
        const concurrent = readInt(
          process.env.DOE_EXCEL_MAX_CONCURRENT_PARSES,
          DEFAULT_MAX_CONCURRENT_PARSES,
          1,
          MAX_ALLOWED_CONCURRENT_PARSES,
        )
        // Zero is a legitimate setting here — it sheds instead of queueing —
        // so the floor is 0, not 1.
        const queued = readInt(
          process.env.DOE_EXCEL_MAX_QUEUED_PARSES,
          DEFAULT_MAX_QUEUED_PARSES,
          0,
          MAX_ALLOWED_QUEUED_PARSES,
        )

        const rejectedOverrides = [
          concurrent.rejected === undefined
            ? undefined
            : `DOE_EXCEL_MAX_CONCURRENT_PARSES=${concurrent.rejected}`,
          queued.rejected === undefined
            ? undefined
            : `DOE_EXCEL_MAX_QUEUED_PARSES=${queued.rejected}`,
        ].filter((entry): entry is string => entry !== undefined)

        // Emitted unconditionally, not only on rejection. The effective pair
        // is what `import-upload/archive-budget.ts` derives its heap figure
        // from, and "what is this container actually running at" should be
        // answerable by grepping a boot log rather than by reasoning about
        // which defaults applied.
        logger.info('Parse gate configured', {
          context: LOGGING_CONTEXT,
          maxConcurrentParses: concurrent.value,
          maxQueuedParses: queued.value,
          ...(rejectedOverrides.length > 0 ? { rejectedOverrides } : {}),
        })

        // Separate from the line above, and at warn, because the two answer
        // different questions. The info line records what this container runs
        // at; this one says somebody asked for something else and did not get
        // it. Only the second is worth waking anyone, so only the second
        // carries a marker.
        if (rejectedOverrides.length > 0) {
          logger.warn('Parse gate ignored a configured value', {
            context: LOGGING_CONTEXT,
            errorCode: PARSE_GATE_CONFIG_REJECTED,
            rejectedOverrides,
            maxConcurrentParses: concurrent.value,
            maxQueuedParses: queued.value,
          })
        }

        return new Semaphore(concurrent.value, queued.value)
      },
      inject: [LOGGER_PROVIDER],
    },
  ],
  exports: [PARSE_GATE],
})
export class ParseGateCoreModule {}
