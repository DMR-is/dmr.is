import type { ErrorMessage } from '../company/company.messages'

/**
 * Error messages for the config module. See `company.messages.ts` for the
 * message-shape contract and usage notes.
 */
export const configMessages = {
  notFound: (key: string): ErrorMessage => ({
    message: `Config entry with key "${key}" not found`,
    translatedMessage: 'Kerfisstilling fannst ekki',
  }),
  changedSinceRead: (key: string): ErrorMessage => ({
    message: `Config entry "${key}" changed since it was read; reload before saving`,
    translatedMessage:
      'Stillingunni var breytt á meðan. Endurhlaðið síðuna og reynið aftur.',
  }),
  thresholdNotPositiveNumber: (value: string): ErrorMessage => ({
    message: `Salary difference threshold must be a positive number with at most two decimals, got "${value}"`,
    translatedMessage:
      'Hlutfallið verður að vera tala hærri en 0, með mest tveimur aukastöfum',
  }),
  thresholdNotLowered: (current: string, next: string): ErrorMessage => ({
    message: `Salary difference threshold may only be lowered: current "${current}", requested "${next}"`,
    translatedMessage: `Hlutfallið má aðeins lækka. Núgildandi hlutfall er ${current}%`,
  }),
  thresholdCurrentValueMalformed: (current: string): ErrorMessage => ({
    message: `Stored salary difference threshold "${current}" is not a valid number — it cannot be compared against, so no update is allowed until the row is repaired`,
    translatedMessage:
      'Núgildandi hlutfall er ekki gild tala. Hafðu samband við kerfisstjóra áður en því er breytt.',
  }),
  mailboxAllowlistInvalid: (value: string): ErrorMessage => ({
    message: `Mailbox allowlist must be "none", "*" or comma-separated 10-digit national IDs, got "${value}"`,
    translatedMessage:
      'Gildið verður að vera "none", "*" eða kennitölur aðskildar með kommu',
  }),
} as const
