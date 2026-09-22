import { Transform } from 'class-transformer'
import { IsString, Matches, MaxLength, MinLength } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

/**
 * Longest `providerId` accepted.
 *
 * Bounded because the value reaches the partial unique index
 * `report_provider_type_provider_id_unique_idx`, not for taste. 256 matches the
 * only other string bound in this area (`import-key.dto.ts`).
 */
export const MAX_PROVIDER_ID_LENGTH = 256

/**
 * Refuses the values that cannot survive being a path segment on the way back.
 *
 * `GET /partner/reports/:providerId` is the only handle this API gives a vendor
 * on a filed report. An id that a URL rewrites before routing files happily and
 * then matches no route, so the report becomes unreadable by the very id the
 * vendor chose for it. Four values do that, and percent-encoding rescues none of
 * them:
 *
 * - **`/`** — `2026/Q1/042` is three segments. `%2F` is normalised back by
 *   proxies and clients on the way in, and this API sits behind a shared ALB.
 * - **`.` and `..`** as the whole segment — dot-segment removal is part of URL
 *   resolution (RFC 3986 §5.2.4), applied by browsers, by `curl` without
 *   `--path-as-is`, and at proxies. `…/reports/..` resolves to the parent
 *   collection and `…/reports/.` to the collection itself, so neither ever
 *   reaches the handler.
 * - **`\`** — WHATWG URL parsing rewrites a backslash to `/`, so it becomes the
 *   first case in any client that follows the URL standard.
 *
 * A dot *within* an id is fine: `2026.Q1.042` is one segment and routes. Only
 * the whole segment being `.` or `..` is the problem, which is why the rule is
 * anchored rather than a ban on the character.
 *
 * Nothing else is bounded. Every other awkward character round-trips once
 * encoded, so refusing more would re-impose a format for taste — the thing
 * loosening this field set out to undo. The specs pin the acceptances for that
 * reason, not only the rejections.
 */
export const PROVIDER_ID_PATTERN = /^(?!\.{1,2}$)[^/\\]+$/

/**
 * The one normalisation this value gets, exported so the read path applies the
 * identical one.
 *
 * The write path trims (see below) because `providerId` is an idempotency key.
 * If a read did not, a vendor whose id reached us with a trailing space would
 * file under the trimmed form and then fetch the untrimmed one and get a `404`
 * on a report that exists. Two trims that agree today is not the same as one
 * trim, which is why this is a function rather than a `.trim()` in each place.
 */
export function normaliseProviderId(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value
}

/**
 * The caller's own identifier for a submission, stored as `report.provider_id`.
 *
 * **Deliberately not a UUID.** Nothing reads this as one — it is compared for
 * equality and nothing else — so requiring the shape only cost a caller whose
 * ids are not UUIDs a mapping table kept to satisfy us. The partner API guide
 * published `2026-Q1-042` as the example of a vendor's own id while the API
 * rejected it.
 *
 * ⚠️ **What the loosening gives up, and where it is made good.** Uniqueness is
 * `(provider_type, provider_id)`, which separates the channels from each other
 * but not the callers *within* one. On the partner channel
 * `EXTERNAL_PROVIDER_CHANNEL` prefixes the authenticated company's kennitala,
 * so two vendors cannot collide. **island.is stores the value raw**
 * (`ISLAND_IS_PROVIDER_CHANNEL.buildProviderId` is identity), and its own
 * docblock rested on the id being "an application UUID minted by one system" —
 * so on that channel this widening removes the only cross-caller guarantee
 * there was. It is acceptable because one system mints those ids and continues
 * to send UUIDs; it is not a property the type system enforces any more.
 *
 * **The value is trimmed before it is validated**, which is not cosmetic: this
 * is an idempotency key. Untrimmed, `"abc"` and `"abc "` are two keys, so a
 * retry that differs only by whitespace files a second report — the exact loss
 * the `replayed` flag exists to make visible. `@ApiUUID()` made that
 * unreachable for free; a bounded string has to say so. Trimming also means
 * `MinLength(1)` refuses a whitespace-only id rather than storing one.
 *
 * **The values a URL rewrites are refused** — see `PROVIDER_ID_PATTERN`. They
 * make a filed report unreadable through the route that reads it back, which is
 * a defect the loosening introduced rather than a leftover of the UUID rule.
 */
export function ApiProviderId(options: ApiPropertyOptions = {}) {
  return applyDecorators(
    ApiProperty({
      type: String,
      minLength: 1,
      maxLength: MAX_PROVIDER_ID_LENGTH,
      pattern: PROVIDER_ID_PATTERN.source,
      example: '2026-Q1-042',
      description:
        'The caller’s own identifier for this submission, stored as the report provider_id. Any non-empty string up to 256 characters — a UUID, `2026-Q1-042`, whatever the calling system mints; the format carries no meaning here. Surrounding whitespace is trimmed, because this value is also the idempotency key and two ids differing only by spacing would file two reports. Uniqueness is enforced on `(provider_type, provider_id)`. It may not contain `/` or `\\`, and may not be `.` or `..`, since this id is also the path segment that reads the report back and a URL rewrites those before routing.',
      ...options,
    }),
    Transform(({ value }) => normaliseProviderId(value)),
    IsString(),
    MinLength(1),
    MaxLength(MAX_PROVIDER_ID_LENGTH),
    Matches(PROVIDER_ID_PATTERN, {
      message:
        'providerId must not contain “/” or “\\”, and must not be “.” or “..” — it is the path segment that reads the report back, and a URL rewrites those before routing, so the report could never be read',
    }),
  )
}
