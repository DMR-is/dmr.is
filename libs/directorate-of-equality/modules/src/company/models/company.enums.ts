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
 *   ACTIVE   → in the authoritative register; subject to the usual reporting
 *              obligations. Set when a company appears in the annual import.
 *   INACTIVE → not in the authoritative register. Set either deliberately by
 *              an admin (e.g. bankruptcy, merged into another company) or
 *              automatically by the company import when a company we hold is
 *              absent from the latest import. Flips back to ACTIVE if it
 *              reappears in a later import. The reason is captured on the
 *              `company_event` STATUS_CHANGED row, not here.
 *
 * Status changes are recorded as `company_event` STATUS_CHANGED events
 * (with from/to status + optional reason), so the full history is explorable
 * via the company timeline rather than a separate status-history table.
 */
export enum CompanyStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Ownership sector — the "private vs government/state" axis for admin filters.
 * Derived from RSK's registered legal form (rekstrarform), NOT from ÍSAT: ÍSAT
 * classifies what an entity *does*, so a state-owned hospital and a private
 * clinic share `86xxx` and section Q. See `utils/legal-form-sector.ts`.
 *
 *   UNKNOWN → not classified. Either RSK has not been consulted for this
 *             company yet, or it returned a legal form we do not map.
 *   PRIVATE → privately owned (hf., ehf., sf., sole trader, …).
 *   PUBLIC  → central government, municipalities, and public institutions.
 *
 * UNKNOWN is deliberately its own value and must never be folded into PRIVATE:
 * an admin filtering for private companies must not silently be shown companies
 * we merely failed to classify. Report it as its own bucket in the UI.
 *
 * Declaration order is load-bearing (Postgres orders by declaration order), so
 * `ORDER BY sector` yields UNKNOWN < PRIVATE < PUBLIC. A finer split (e.g.
 * MUNICIPAL separate from central government) can be added in Postgres with
 * `ALTER TYPE company_sector_enum ADD VALUE`.
 */
export enum CompanySectorEnum {
  UNKNOWN = 'UNKNOWN',
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
}

/**
 * Derived reporting-compliance status surfaced on `CompanyDto`. Not persisted —
 * computed from the company's size/obligations and its reports (see
 * `utils/report-status.ts`). A single value, evaluated in priority order; the
 * first unmet obligation wins (most critical first).
 *
 *   MISSING_EQUALITY_REPORT → "Vantar jafnréttisáætlun": 25+ employees
 *       (MEDIUM|LARGE) with no active/approved equality report.
 *   MISSING_SALARY_REPORT   → "Vantar launagreiningu": a salary report is
 *       required (50+/LARGE, or admin override — i.e. `salary_report_required`)
 *       with no active/approved salary report.
 *
 *   For both of the above, an unexpired certification from the Directorate's
 *   retired register (`legacy_report`) counts as coverage in place of a report,
 *   so a company certified under the old regime does not read as missing one it
 *   holds. See `activeLegacyCertificationExists` in `utils/report-status.ts`.
 *   MISSING_ACTION_PLAN     → "Vantar úrbótaáætlun": a salary report is
 *       POSTPONED, i.e. it has pay-gap outliers whose explanations are still
 *       deferred.
 *   SATISFACTORY            → "Fullnægjandi": none of the above; the company
 *       has met its obligations.
 */
export enum CompanyReportStatusEnum {
  MISSING_EQUALITY_REPORT = 'MISSING_EQUALITY_REPORT',
  MISSING_SALARY_REPORT = 'MISSING_SALARY_REPORT',
  MISSING_ACTION_PLAN = 'MISSING_ACTION_PLAN',
  SATISFACTORY = 'SATISFACTORY',
}
