/**
 * Whether a stored value can be used as the sole recipient of an official notice.
 *
 * ⚠️ **One address, and it has to look like one.** The three columns this module
 * mails to — `report.contactEmail`, `report.companyAdminEmail` and
 * `company.email` — are all `IsString()` only: no `@IsEmail`, no `MinLength`, so
 * whatever was typed is what is stored. `contactEmail` now carries the approval's
 * pay-gap PDFs rather than a comment notice.
 *
 * Shared by the report mail and the deadline reminder deliberately. The two paths
 * had different standards for "is this an address" — the report path an `@` test,
 * the reminder path nothing at all — and two standards in one module is worse
 * than either.
 *
 * The `@` test alone was not enough: nodemailer splits `to` on commas, so
 * `'a@x.is, b@y.is'` passed it and sent employee salary and gender data to every
 * address in the list. `ResultWrapper.ok(info)` discards `info.rejected`, so a
 * partial delivery would still report success and be archived as received.
 * Semicolons, angle brackets and interior whitespace are rejected for the same
 * reason — each is a separator or a display-name wrapper some transport will
 * expand.
 *
 * Still not validation: a single malformed token is passed through to SES, which
 * is the authority on deliverability and rejects with a logged err result.
 */
export const looksLikeOneAddress = (
  candidate: string | undefined,
): candidate is string =>
  !!candidate &&
  candidate.includes('@') &&
  !/[,;<>\s]/.test(candidate)
