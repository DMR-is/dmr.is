import { randomBytes } from 'crypto'
import { UniqueConstraintError } from 'sequelize'

import {
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common'

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Length of a generated report identifier. */
export const REPORT_IDENTIFIER_LENGTH = 6

/** Retries allowed when a minted identifier turns out to be taken. */
export const IDENTIFIER_ALLOCATION_ATTEMPTS = 5

/** Partial unique index on `report.identifier`, added by m-20260814. */
export const REPORT_IDENTIFIER_INDEX = 'report_identifier_unique_idx'

/** True when `error` is the `report.identifier` uniqueness violation. */
export function isReportIdentifierCollision(error: unknown): boolean {
  if (!(error instanceof UniqueConstraintError)) {
    return false
  }

  const constraint = (error.parent as { constraint?: string } | undefined)
    ?.constraint

  return constraint === REPORT_IDENTIFIER_INDEX
}

/**
 * Re-raises a write failure, turning an identifier collision into a *retryable*
 * error and leaving everything else untouched.
 *
 * Without this the collision surfaces as HTTP 400: `SequelizeExceptionFilter`
 * maps every `UniqueConstraintError` to 400, which tells island.is the request
 * was malformed and must not be retried. It is the opposite — the payload was
 * fine, two concurrent draws happened to collide, and retrying succeeds. On a
 * report submit a 400 means a silently dropped submission.
 *
 * Deliberately not a retry loop. Probe and insert both run inside the request's
 * CLS transaction, so catching the violation leaves that transaction aborted —
 * an in-place retry would need the insert wrapped in a nested
 * `sequelize.transaction()` (a `SAVEPOINT`) on every report creation, to survive
 * an event with a ~1-in-309M chance per concurrent pair. Handing the caller a
 * 503 it already knows how to retry is the proportionate answer.
 */
export function rethrowReportWriteError(error: unknown): never {
  if (isReportIdentifierCollision(error)) {
    throw new ServiceUnavailableException(
      'Could not allocate a unique report identifier — please retry',
    )
  }

  throw error
}

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
  return Array.from(randomBytes(length), (b) => ALPHA[b % ALPHA.length]).join(
    '',
  )
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
