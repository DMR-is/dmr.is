import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

import { normaliseProviderId } from '@dmr.is/decorators'

/**
 * Normalises `:providerId` on the way in, the same way the submission does.
 *
 * The submission trims before it stores, because the value is an idempotency
 * key. A read that did not trim would answer `404` for a report that exists: a
 * vendor whose id reaches us with a trailing space — a stray `%20`, a trailing
 * newline out of a CSV column — files under the trimmed form and then cannot
 * fetch it back under the form it holds.
 *
 * It shares `normaliseProviderId` with the DTO rather than calling `.trim()`
 * itself, so the two sides cannot drift into two normalisations that merely
 * agree today.
 *
 * It deliberately does **not** apply `PROVIDER_ID_PATTERN`. The values that rule
 * refuses are the ones a URL rewrites before routing, so they cannot arrive here
 * as a path segment in the first place — checking for them would be dead code
 * that reads like a safeguard.
 */
@Injectable()
export class ProviderIdParamPipe implements PipeTransform<unknown, string> {
  transform(value: unknown): string {
    const normalised = normaliseProviderId(value)

    if (typeof normalised !== 'string' || normalised.length === 0) {
      throw new BadRequestException('providerId is required')
    }

    return normalised
  }
}
