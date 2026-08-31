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

import { PARSE_GATE } from './parse-gate.token'
import { Semaphore } from './semaphore'

/**
 * Read a positive integer from the environment, falling back when it is unset
 * or unusable.
 *
 * Unset is the normal case: neither variable is declared required, so nothing
 * has to be added to a task definition before this ships. The fallbacks are
 * the operating values, not placeholders.
 *
 * A malformed value falls back rather than propagating. `Number('two')` is
 * `NaN`, and `NaN` passes the constructor's `< 1` check while making every
 * `active < maxConcurrent` comparison false — so a typo would not throw, it
 * would wedge every parse in the queue until the queue filled and then shed
 * everything with a 503. Failing back to a working default beats failing into
 * that.
 */
const readInt = (
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number => {
  if (raw === undefined) return fallback

  // Digits only, deliberately narrower than `Number`. `Number('0x10')` is 16
  // and `Number('1e3')` is 1000 — both are whole numbers in range, so every
  // check below would pass a value nobody meant to write.
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return fallback

  const parsed = Number(trimmed)
  return parsed >= min && parsed <= max ? parsed : fallback
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
 */
const MAX_ALLOWED_CONCURRENT_PARSES = 8
const MAX_ALLOWED_QUEUED_PARSES = 200

@Module({
  providers: [
    {
      provide: PARSE_GATE,
      // A factory rather than a module-scope constant: this reads the
      // environment when the module is instantiated, not when the file is
      // first imported, which is the difference between seeing a variable and
      // missing it.
      useFactory: (): Semaphore =>
        new Semaphore(
          readInt(
            process.env.DOE_EXCEL_MAX_CONCURRENT_PARSES,
            DEFAULT_MAX_CONCURRENT_PARSES,
            1,
            MAX_ALLOWED_CONCURRENT_PARSES,
          ),
          // Zero is a legitimate setting here — it sheds instead of queueing —
          // so the floor is 0, not 1.
          readInt(
            process.env.DOE_EXCEL_MAX_QUEUED_PARSES,
            DEFAULT_MAX_QUEUED_PARSES,
            0,
            MAX_ALLOWED_QUEUED_PARSES,
          ),
        ),
    },
  ],
  exports: [PARSE_GATE],
})
export class ParseGateCoreModule {}
