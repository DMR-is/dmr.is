import { InternalServerErrorException } from '@nestjs/common'

import { MailboxDeliveryKindEnum } from './models/mailbox-delivery.enums'

export interface MailboxDeliveryIdempotencyKeyParts {
  kind: MailboxDeliveryKindEnum
  /** The recipient company's id: a UUID, in either case. */
  companyId: string
  /**
   * What makes this notice different from the company's other notices of the
   * same kind, e.g. the report kind and its due date as `YYYYMMDD`
   * (`SALARY-20270301`). 1-64 ASCII letters, digits, `.`, `_` or `-`, checked
   * as given, then upper-cased, so `salary-20270301` gives the same key. Must
   * be derived from stored data, never from the clock at send time, or a rerun
   * makes a new key and sends again.
   *
   * Never use a case-sensitive id (e.g. base62) as a discriminator:
   * upper-casing folds `aB1` and `Ab1` into one key, so two different notices
   * would share it and the second would never be sent.
   */
  discriminator: string
}

/** Bumped only if the format changes, so old and new keys can never collide. */
const KEY_VERSION = 'v1'

/**
 * Tested on the discriminator as given, before upper-casing: `toUpperCase` maps
 * some non-ASCII letters to ASCII (`ß` to `SS`, `ı` and `ſ` to `I` and `S`,
 * `ﬁ` to `FI`), so testing its result would let them through as other keys.
 */
const DISCRIMINATOR = /^[A-Za-z0-9._-]{1,64}$/
const COMPANY_ID_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * `mailbox-delivery:v1:<kind>:<companyId>:`, the part of a key that names the
 * kind and company. Starting with it is not enough: `deliverToMailbox` refuses
 * any key that is not exactly what `buildMailboxDeliveryIdempotencyKey`
 * returns for the delivery's own kind and company.
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
  if (!DISCRIMINATOR.test(discriminator)) {
    throw new InternalServerErrorException(
      'A mailbox delivery key discriminator must be 1-64 ASCII letters, digits, ., _ or -',
    )
  }
  const normalised = discriminator.toUpperCase()
  return `${mailboxDeliveryIdempotencyKeyPrefix(kind, companyId)}${normalised}`
}
