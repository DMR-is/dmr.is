/**
 * Coarse company-size bucket derived from RSK headcount. Persisted on
 * `company.employee_count_category` and snapshotted onto `company_report`.
 *
 * Bucket boundaries (regulatory):
 *   UNKNOWN → size not yet established (e.g. auto-provisioned company)
 *   SMALL   → 0–24 employees
 *   MEDIUM  → 25–49 employees
 *   LARGE   → 50+ employees
 *
 * UNKNOWN is the default for companies we have no headcount for: it imposes no
 * reporting obligations (like SMALL) until an admin classifies the company, but
 * is honest about the size being unknown rather than asserting it is small.
 *
 * The LARGE bucket is the threshold that triggers a required salary report
 * (see the `company_sync_salary_report_required` DB trigger).
 *
 * Declaration order is load-bearing: Postgres orders enum values by
 * declaration order, so `ORDER BY employee_count_category` yields
 * UNKNOWN < SMALL < MEDIUM < LARGE. A future bucket (e.g. between MEDIUM and
 * LARGE) can be inserted in Postgres with
 * `ALTER TYPE ... ADD VALUE 'XYZ' BEFORE 'LARGE'`.
 */
export enum CompanySizeEnum {
  UNKNOWN = 'UNKNOWN',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}
