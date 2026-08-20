/**
 * Types for `scenario-cohort.js`. The module itself is CommonJS because
 * `db/seeders/*.js` run under plain node via sequelize-cli and cannot import
 * TypeScript; this declaration lets `scripts/refresh-wage-gap-fixtures.ts`
 * consume the same data with types.
 */

/** One seeded employee. `roleIndex` points into the seeder's `roleIds` array. */
export type ScenarioEmployee = {
  ordinal: number
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL'
  roleIndex: number
  score: number
  field: string
  department: string
  startDate: string
  paidHours: number
  baseSalary: number
  additionalFixedOvertime: number
  bonusPayments: number | null
}

export const SEEDED_PAID_HOURS: number
export const MANAGEMENT_LOW_SCORE: number
export const MANAGEMENT_HIGH_SCORE: number
export const EDUCATION_LOW_SCORE: number
export const EDUCATION_HIGH_SCORE: number
export const MANAGER_TOTAL_SCORE: number
export const SPECIALIST_TOTAL_SCORE: number
export const ASSISTANT_TOTAL_SCORE: number
export const OUTLIER_BASE_SALARY: number
export const COMPLIANT_BASE_SALARY: number

export function scenarioEmployees(hasOutliers: boolean): ScenarioEmployee[]
export function scenarioHourlyWage(employee: ScenarioEmployee): number
