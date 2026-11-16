/**
 * Configuration for Skatturinn's WithholdingTaxApi.
 *
 * Read from the environment on every call, never at import time, so a value
 * that arrives after this module loads is still picked up:
 * - `RSK_WITHHOLDING_TAX_API_PATH` — base URL, e.g. the test host
 *   `https://vefurp.rsk.is/ws/withholdingtax`. Deliberately no default: falling
 *   back to the test host would let a misconfigured production service read
 *   test data without anyone noticing.
 * - `RSK_WITHHOLDING_TAX_USERNAME` / `RSK_WITHHOLDING_TAX_PASSWORD` — the
 *   credentials Skatturinn issues, exchanged for a bearer token at `/token`.
 */

export const WITHHOLDING_TAX_TOKEN_TIMEOUT_MS = 15_000

/** `GetJobCount` returns every company at 25+ positions in one response. */
export const WITHHOLDING_TAX_JOB_COUNT_TIMEOUT_MS = 120_000

export interface WithholdingTaxConfig {
  baseUrl: string
  username: string
  password: string
}

export type WithholdingTaxConfigResult =
  | { ok: true; config: WithholdingTaxConfig }
  /** Names of the unset variables — never their values. */
  | { ok: false; missing: string[] }

export function readWithholdingTaxConfig(): WithholdingTaxConfigResult {
  const baseUrl = process.env.RSK_WITHHOLDING_TAX_API_PATH?.trim()
  const username = process.env.RSK_WITHHOLDING_TAX_USERNAME?.trim()
  const password = process.env.RSK_WITHHOLDING_TAX_PASSWORD
  if (!baseUrl || !username || !password) {
    return {
      ok: false,
      missing: [
        !baseUrl && 'RSK_WITHHOLDING_TAX_API_PATH',
        !username && 'RSK_WITHHOLDING_TAX_USERNAME',
        !password && 'RSK_WITHHOLDING_TAX_PASSWORD',
      ].filter((name): name is string => Boolean(name)),
    }
  }
  return {
    ok: true,
    config: { baseUrl: baseUrl.replace(/\/+$/, ''), username, password },
  }
}
