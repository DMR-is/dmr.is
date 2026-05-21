/**
 * Coarse company-size bucket derived from RSK headcount. Persisted on
 * `company.employee_count_category` and snapshotted onto `company_report`.
 *
 * Bucket boundaries (regulatory):
 *   SMALL  → 0–24 employees
 *   MEDIUM → 25–49 employees
 *   LARGE  → 50+ employees
 *
 * The LARGE bucket is the threshold that triggers a required salary report
 * (see the `company_sync_salary_report_required` DB trigger).
 *
 * Declaration order is load-bearing: Postgres orders enum values by
 * declaration order, so `ORDER BY employee_count_category` yields
 * SMALL < MEDIUM < LARGE. A future bucket (e.g. between MEDIUM and LARGE)
 * can be inserted in Postgres with `ALTER TYPE ... ADD VALUE 'XYZ' BEFORE 'LARGE'`.
 */
export enum CompanySizeEnum {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}
