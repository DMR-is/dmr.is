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
  thresholdNotPositiveNumber: (value: string): ErrorMessage => ({
    message: `Salary difference threshold must be a positive number, got "${value}"`,
    translatedMessage: 'Hlutfallið verður að vera tala hærri en 0',
  }),
  thresholdNotLowered: (current: string, next: string): ErrorMessage => ({
    message: `Salary difference threshold may only be lowered: current "${current}", requested "${next}"`,
    translatedMessage: `Hlutfallið má aðeins lækka. Núgildandi hlutfall er ${current}%`,
  }),
} as const
