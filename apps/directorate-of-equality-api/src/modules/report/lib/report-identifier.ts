import { randomBytes } from 'crypto'

import { InternalServerErrorException } from '@nestjs/common'

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Length of a generated report identifier. */
export const REPORT_IDENTIFIER_LENGTH = 6

/** Retries allowed when a minted identifier turns out to be taken. */
export const IDENTIFIER_ALLOCATION_ATTEMPTS = 5

/**
 * Mints a report identifier — the short handle (`KTPQZW`) reviewers and
 * applicants use to refer to a report in tickets and email instead of the
 * company's kennitala. It carries no meaning and is not derived from anything
 * about the report; that is the point, since quoting a kennitala is what it
 * exists to avoid.
 *
 * Six uppercase letters ≈ 309M combinations. The modulo folding of the random
 * bytes biases very slightly toward the first 22 letters, which is irrelevant
 * here: the identifier is a display handle, never a secret or a capability, and
 * is not relied on for unguessability. Uniqueness is enforced by the caller
 * (see `IReportIdentifierService`), not by this function.
 */
export function generateReportIdentifier(
  length = REPORT_IDENTIFIER_LENGTH,
): string {
  return Array.from(randomBytes(length), (b) => ALPHA[b % ALPHA.length]).join('')
}

/**
 * Mints an identifier that is not already in use, retrying on collision.
 *
 * Six letters is ~309M combinations, so a collision is unlikely but not
 * negligible across years of reports (birthday bound ≈ 17k). Two reports
 * sharing a code would make an admin identifier search ambiguous, so each
 * candidate is probed first.
 *
 * `isTaken` is supplied by the caller so this stays a pure policy — the one
 * caller that supplies it is `ReportIdentifierService`, which probes the report
 * table. The probe is best-effort under true concurrency: it cannot see an
 * insert another request has not committed, and under the request's CLS
 * transaction it cannot see it at all. The partial unique index
 * `report_identifier_unique_idx` is what makes a duplicate impossible; this loop
 * exists to remove the far likelier birthday collision against committed rows
 * without ever reaching that error path.
 *
 * The caller probes with `count`, not `findOne`: only existence matters, and the
 * report row's `findOne` is already load-bearing for provider-tuple replay
 * lookups that assert on call order.
 */
export async function allocateReportIdentifier(
  isTaken: (candidate: string) => Promise<boolean>,
  onCollision?: (candidate: string, attempt: number) => void,
): Promise<string> {
  for (let attempt = 1; attempt <= IDENTIFIER_ALLOCATION_ATTEMPTS; attempt++) {
    const candidate = generateReportIdentifier()

    if (!(await isTaken(candidate))) {
      return candidate
    }

    onCollision?.(candidate, attempt)
  }

  throw new InternalServerErrorException(
    `Could not allocate an unused report identifier in ${IDENTIFIER_ALLOCATION_ATTEMPTS} attempts`,
  )
}
