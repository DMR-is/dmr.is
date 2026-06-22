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

/**
 * Lifecycle status of a company in the DoE register.
 *
 *   ACTIVE   → operating; subject to the usual reporting obligations.
 *   INACTIVE → no longer operating (e.g. bankruptcy, merged into another
 *              company). Set by an admin; the reason is captured on the
 *              `company_event` STATUS_CHANGED row, not here.
 *   UNKNOWN  → the company is in our register but absent from the latest
 *              authoritative annual import — it should be in the list, so
 *              something is off, but we don't yet know what. Set by the
 *              company import; flips back to ACTIVE when it reappears.
 *
 * Status changes are recorded as `company_event` STATUS_CHANGED events
 * (with from/to status + optional reason), so the full history is explorable
 * via the company timeline rather than a separate status-history table.
 */
export enum CompanyStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNKNOWN = 'UNKNOWN',
}
