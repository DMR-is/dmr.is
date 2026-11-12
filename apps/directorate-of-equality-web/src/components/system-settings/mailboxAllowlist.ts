/**
 * The stored allowlist value, read the way the API reads it
 * (`libs/directorate-of-equality/modules/src/config/lib/mailbox-allowlist.ts`):
 * `none`, `*`, or comma-separated kennitölur with hyphens and whitespace
 * ignored. Anything else reads as nobody, as it does in the API.
 */
export type MailboxAllowlistMode = 'none' | 'all' | 'list'

export type ParsedMailboxAllowlist =
  | { mode: 'none' }
  | { mode: 'all' }
  | { mode: 'list'; nationalIds: string[] }

const NATIONAL_ID = /^\d{10}$/

export const splitNationalIds = (value: string): string[] =>
  value
    .split(/[,\n]/)
    .map((entry) => entry.replace(/[\s-]/g, ''))
    .filter((entry) => entry.length > 0)

export const invalidNationalIds = (entries: string[]): string[] =>
  entries.filter((entry) => !NATIONAL_ID.test(entry))

export const parseMailboxAllowlist = (
  value: string | null | undefined,
): ParsedMailboxAllowlist => {
  const trimmed = (value ?? '').trim()
  if (trimmed === '*') return { mode: 'all' }
  if (trimmed === '' || trimmed.toLowerCase() === 'none')
    return { mode: 'none' }
  const entries = splitNationalIds(trimmed)
  if (entries.length === 0 || invalidNationalIds(entries).length > 0) {
    return { mode: 'none' }
  }
  return { mode: 'list', nationalIds: [...new Set(entries)] }
}
