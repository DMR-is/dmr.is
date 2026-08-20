import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

import { SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY } from '../config.constants'
import { ConfigModel } from '../models/config.model'

/**
 * Numeric config keys the salary analysis reads, named once.
 *
 * `config` is versioned by `supersededAt`, so every read must filter on
 * `supersededAt: null` to get the current row rather than an old one. Getting
 * that wrong silently returns a stale threshold, which is why the read lives
 * here instead of being written out at each call site.
 *
 * ⚠️ The key *strings* are owned by `config.constants.ts`, not by this map —
 * that file's copy is what gates the lowering-only ratchet in
 * `ConfigService.updateByKey`, so a second literal here could silently read one
 * row while the write path guarded another. This map exists for the typed read
 * helpers below; it does not define names.
 */
export const CONFIG_KEYS = {
  /**
   * The statutory 3,9%. Historically the *individual* outlier band (halved to
   * ±1,95% before comparison — scaffolding that was never the intended rule);
   * now also the company-wide benchmark the óskýrt figure is tested against.
   *
   * ⚠️ Kept as ONE key deliberately. An earlier draft proposed a second
   * `gap_benchmark_percent` on the reasoning that a per-employee tolerance and a
   * company-wide gap measure different things and might need to diverge. They
   * might — but the band is being retired entirely, so a second key today would
   * seed two values that must be kept equal by hand, with nothing enforcing it.
   * Split it when there is a reason to, not in anticipation of one.
   */
  SALARY_DIFFERENCE_THRESHOLD_PERCENT: SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
} as const

export type NumericConfigKey =
  (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS]

/**
 * Validates a raw config value as a number, or throws.
 *
 * Split out from the read because callers reach `config` two ways — some inject
 * `IConfigService`, some the model — but the *validation* is the part that had
 * drifted across five copies: differing exception types, differing messages, and
 * one that silently produced `NaN` from a missing row and then reported it as
 * "must be numeric" rather than "not found".
 *
 * A missing key is a deployment problem (the seed did not run); a non-numeric
 * value is a data problem (someone typed `3,9%` into the admin UI). They want
 * different signals, so they get different exceptions.
 */
export function parseNumericConfig(
  value: string | null | undefined,
  key: NumericConfigKey,
): number {
  if (value === null || value === undefined) {
    throw new NotFoundException(`Config entry "${key}" not found`)
  }

  const parsed = parseFloat(value)

  if (!Number.isFinite(parsed)) {
    throw new InternalServerErrorException(
      `Config entry "${key}" must be numeric; got "${value}"`,
    )
  }

  return parsed
}

/**
 * Reads and validates a numeric config value straight off the model.
 *
 * ⚠️ `config` is versioned by `supersededAt`, so the filter below is not
 * optional — omitting it can return a superseded row, i.e. last year's
 * threshold, with nothing to indicate it happened.
 */
export async function readNumericConfig(
  configModel: typeof ConfigModel,
  key: NumericConfigKey,
): Promise<number> {
  const row = await configModel.findOne({
    where: { key, supersededAt: null },
  })

  return parseNumericConfig(row?.value, key)
}
