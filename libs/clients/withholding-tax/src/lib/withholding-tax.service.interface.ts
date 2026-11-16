import type { WithholdingTaxJobCount } from './withholding-tax.schemas'

export interface WithholdingTaxJobCountResult {
  incomeYear: number
  companies: WithholdingTaxJobCount[]
  /**
   * Rows that failed validation and were left out, by position in the
   * response. One malformed row does not discard the other companies.
   */
  skipped: { index: number; issues: string[] }[]
}

export interface IWithholdingTaxService {
  /**
   * Every company Skatturinn counts at 25–49 or 50+ average positions in
   * `incomeYear`. A company absent from the result is below 25 or unknown to
   * Skatturinn: absence is not a confirmed 0–24.
   *
   * @throws WithholdingTaxError
   */
  getJobCounts(incomeYear: number): Promise<WithholdingTaxJobCountResult>

  /**
   * Logs in with a fresh token, proving the credentials work now.
   *
   * @throws WithholdingTaxError
   */
  checkConnection(): Promise<void>
}

export const IWithholdingTaxService = Symbol('IWithholdingTaxService')
