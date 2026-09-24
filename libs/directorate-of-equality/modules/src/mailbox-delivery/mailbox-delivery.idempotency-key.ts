import { InternalServerErrorException } from '@nestjs/common'

import { MailboxDeliveryKindEnum } from './models/mailbox-delivery.enums'

export interface MailboxDeliveryIdempotencyKeyParts {
  kind: MailboxDeliveryKindEnum
  /** The recipient company's id: a UUID, in either case. */
  companyId: string
  /**
   * What makes this notice different from the company's other notices of the
   * same kind, e.g. the report kind and its due date as `YYYYMMDD`
   * (`SALARY-20270301`). Upper-cased, so `salary-20270301` gives the same
   * key; then 1-64 letters, digits, `.`, `_` or `-`. Must be derived from
   * stored data, never from the clock at send time, or a rerun makes a new key
   * and sends again.
   */
  discriminator: string
}

/** Bumped only if the format changes, so old and new keys can never collide. */
const KEY_VERSION = 'v1'

const DISCRIMINATOR = /^[A-Z0-9._-]{1,64}$/
const COMPANY_ID_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * `mailbox-delivery:v1:<kind>:<companyId>:`, the part of a key that names the
 * kind and company. `deliverToMailbox` refuses a key that does not start with
 * it for the delivery's own kind and company.
 */
export function mailboxDeliveryIdempotencyKeyPrefix(
  kind: MailboxDeliveryKindEnum,
  companyId: string,
): string {
  return `mailbox-delivery:${KEY_VERSION}:${kind}:${companyId.toLowerCase()}:`
}

/**
 * The idempotency key for a mailbox delivery:
 *
 *     mailbox-delivery:v1:<kind>:<companyId>:<discriminator>
 *
 * e.g. `mailbox-delivery:v1:OVERDUE_NOTICE:5f0c…:SALARY-20270301`.
 *
 * The same parts always give the same key, and no two different sets of
 * parts give the same key (no part may contain `:`). `companyId` must be a
 * UUID and is lowercased, and `discriminator` is upper-cased, so the same
 * company or discriminator written in another case gives the same key rather
 * than a second delivery. The key is the only
 * guard against sending a notice twice, so every caller must build it here:
 * a hand-built key in another format would not match this one and would send
 * again. Throws on a part that does not fit.
 */
export function buildMailboxDeliveryIdempotencyKey({
  kind,
  companyId,
  discriminator,
}: MailboxDeliveryIdempotencyKeyParts): string {
  if (!Object.values(MailboxDeliveryKindEnum).includes(kind)) {
    throw new InternalServerErrorException(
      `Unknown mailbox delivery kind ${String(kind)}`,
    )
  }
  if (!COMPANY_ID_UUID.test(companyId)) {
    throw new InternalServerErrorException(
      'A mailbox delivery key needs the company id as a UUID',
    )
  }
  const normalised = discriminator.toUpperCase()
  if (!DISCRIMINATOR.test(normalised)) {
    throw new InternalServerErrorException(
      'A mailbox delivery key discriminator must be 1-64 letters, digits, ., _ or -',
    )
  }
  return `${mailboxDeliveryIdempotencyKeyPrefix(kind, companyId)}${normalised}`
}
