import { Transform } from 'class-transformer'
import { IsString, MaxLength, MinLength } from 'class-validator'

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
 */
export function ApiProviderId(options: ApiPropertyOptions = {}) {
  return applyDecorators(
    ApiProperty({
      type: String,
      minLength: 1,
      maxLength: MAX_PROVIDER_ID_LENGTH,
      example: '2026-Q1-042',
      description:
        'The caller’s own identifier for this submission, stored as the report provider_id. Any non-empty string up to 256 characters — a UUID, `2026-Q1-042`, whatever the calling system mints; the format carries no meaning here. Surrounding whitespace is trimmed, because this value is also the idempotency key and two ids differing only by spacing would file two reports. Uniqueness is enforced on `(provider_type, provider_id)`.',
      ...options,
    }),
    Transform(({ value }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
    IsString(),
    MinLength(1),
    MaxLength(MAX_PROVIDER_ID_LENGTH),
  )
}
