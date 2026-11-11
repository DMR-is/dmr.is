/**
 * Which companies may receive notices in their island.is mailbox, read from
 * the `onesystems_mailbox_allowlist` config row.
 *
 * `ONESYSTEMS_ENABLED` switches the mailbox on for an environment; this row
 * narrows it to named companies. Both must allow a company before anything is
 * sent to One for it. Every other company is treated as though the flag were
 * off: approvals, denials and reminders go by email, and receipts wait.
 *
 * It exists because dev talks to production One (there is no test instance),
 * so a dev environment with the flag on would otherwise send real letters to
 * whatever companies its database holds. It lives in the config table, not an
 * env var, so it can be changed through the admin API without a deploy.
 *
 * Stored value:
 * - `none`: no company (the migration's default, so a fresh database sends
 *   nothing to One whatever the flag says)
 * - `*`: every company (fully live)
 * - kennitölur separated by commas, e.g. `1234567890, 0987654321`. Hyphens and
 *   whitespace are ignored.
 *
 * A missing row reads as `none`.
 */
export type MailboxAllowlist =
  | { all: true }
  | { all: false; nationalIds: ReadonlySet<string> }

export const MAILBOX_ALLOWLIST_NONE = 'none'
export const MAILBOX_ALLOWLIST_ALL = '*'

const NOBODY: MailboxAllowlist = { all: false, nationalIds: new Set() }

const NATIONAL_ID_PATTERN = /^\d{10}$/

const splitEntries = (value: string): string[] =>
  value
    .split(',')
    .map((entry) => entry.replace(/[\s-]/g, ''))
    .filter((entry) => entry.length > 0)

/**
 * The stored value in canonical form, or null when it is not a valid value.
 * The admin update stores what this returns, so the reader never has to guess.
 */
export const normalizeMailboxAllowlistValue = (value: string): string | null => {
  const trimmed = value.trim()

  if (trimmed === MAILBOX_ALLOWLIST_ALL) {
    return MAILBOX_ALLOWLIST_ALL
  }
  if (trimmed.toLowerCase() === MAILBOX_ALLOWLIST_NONE) {
    return MAILBOX_ALLOWLIST_NONE
  }

  const entries = splitEntries(trimmed)
  if (
    entries.length === 0 ||
    !entries.every((entry) => NATIONAL_ID_PATTERN.test(entry))
  ) {
    return null
  }

  return [...new Set(entries)].join(',')
}

/**
 * Reads a stored value. Anything that does not parse reads as nobody: a broken
 * row must not open the mailbox to every company.
 */
export const parseMailboxAllowlist = (
  value: string | null | undefined,
): MailboxAllowlist => {
  const normalized =
    value === null || value === undefined
      ? null
      : normalizeMailboxAllowlistValue(value)

  if (normalized === null || normalized === MAILBOX_ALLOWLIST_NONE) {
    return NOBODY
  }
  if (normalized === MAILBOX_ALLOWLIST_ALL) {
    return { all: true }
  }
  return { all: false, nationalIds: new Set(normalized.split(',')) }
}

export const mailboxAllowlistAllows = (
  allowlist: MailboxAllowlist,
  nationalId: string | null | undefined,
): boolean =>
  allowlist.all ||
  (!!nationalId && allowlist.nationalIds.has(nationalId.replace(/[\s-]/g, '')))
