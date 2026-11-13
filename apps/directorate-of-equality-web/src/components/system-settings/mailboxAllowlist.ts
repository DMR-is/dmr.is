import { isValid } from 'kennitala'

/**
 * The stored allowlist value, read exactly the way the API reads it
 * (`libs/directorate-of-equality/modules/src/config/lib/mailbox-allowlist.ts`):
 * `none`, `*`, or kennitölur separated by commas, with hyphens and whitespace
 * ignored. Anything else reads as nobody, as it does in the API. Keep the two
 * in step: a difference means the page shows a value the dispatcher does not
 * act on.
 */
export type MailboxAllowlistMode = 'none' | 'all' | 'list'

export type ParsedMailboxAllowlist =
  | { mode: 'none' }
  | { mode: 'all' }
  | { mode: 'list'; nationalIds: string[] }

const TEN_DIGITS = /^\d{10}$/

/** The API's `splitEntries`: commas only. */
const splitStored = (value: string): string[] =>
  value
    .split(',')
    .map((entry) => entry.replace(/[\s-]/g, ''))
    .filter((entry) => entry.length > 0)

export const parseMailboxAllowlist = (
  value: string | null | undefined,
): ParsedMailboxAllowlist => {
  const trimmed = (value ?? '').trim()
  if (trimmed === '*') return { mode: 'all' }
  if (trimmed === '' || trimmed.toLowerCase() === 'none') {
    return { mode: 'none' }
  }
  const entries = splitStored(trimmed)
  if (entries.length === 0 || !entries.every((e) => TEN_DIGITS.test(e))) {
    return { mode: 'none' }
  }
  return { mode: 'list', nationalIds: [...new Set(entries)] }
}

/** The canonical stored form, as the API normalises it. */
export const normalizeMailboxAllowlist = (
  value: string | null | undefined,
): string => {
  const parsed = parseMailboxAllowlist(value)
  if (parsed.mode === 'all') return '*'
  if (parsed.mode === 'none') return 'none'
  return parsed.nationalIds.join(',')
}

/**
 * What an admin typed: commas or new lines between entries. Turned into the
 * comma-separated form before it is saved, so the stored value never holds a
 * new line.
 */
export const splitTypedNationalIds = (value: string): string[] =>
  splitStored(value.replace(/\n/g, ','))

/**
 * Typed entries that are not a valid kennitala. Stricter than the API's
 * ten-digit check: a typo that happens to be ten digits could be another real
 * company, and dev sends to production One.
 */
export const invalidNationalIds = (entries: string[]): string[] =>
  entries.filter((entry) => !TEN_DIGITS.test(entry) || !isValid(entry))
