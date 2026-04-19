# DoE DB Schema

## Overview

This database backs the Directorate of Equality (DoE) salary equality reporting system. Every Icelandic company with **50 or more employees** is required by law to submit a salary equality report. DoE reviewers audit each report, approve or reject it, and publish an anonymized summary of every approved report to a public site. Approved reports are valid for **three years**, after which the company must resubmit.

Scope of this schema: the ≥50-employee flow only. Smaller-company flows and edge cases (mergers, exemptions, liquidations) are out of scope for now.

## Actors

- **Company admin** — fills out and submits reports on behalf of a company. In parent/subsidiary groups, one company acts as the parent and reports on its daughter companies in the same submission.
- **DoE reviewer (admin)** — reads submitted reports, denies with reason, approves when valid, flags fine accrual. Identified by a row in the `user` table.
- **Public consumer** — browses anonymized aggregates on the public site. Has no access to PII or to denied/draft reports.

## Report lifecycle

`report.status` drives every transition. `previous_report_id` chains resubmissions.

```
  DRAFT  ──submit──▶  SUBMITTED  ──pickup──▶  IN_REVIEW
                                                  │
                       ┌──────────────────────────┤
                       ▼                          ▼
                    DENIED                     APPROVED
                       │                          │
                       │ (resubmit = new row      │ (3yr later, or on new approval)
                       │  with previous_report_id │
                       │  pointing here)          ▼
                       │                       SUPERSEDED
                       ▼
                  (new DRAFT row)
```

State-by-state:

- **`DRAFT`** — company admin is still editing. Not visible to reviewers. Most columns may be null. Can transition to `SUBMITTED`.
- **`SUBMITTED`** — company finalized the submission. `submitted_at` stamped. Waits in reviewer queue.
- **`IN_REVIEW`** — a reviewer has picked up the report. (If you want reviewer-assignment tracking, stamp `reviewed_by` on pickup; currently it's stamped on the final decision.)
- **`DENIED`** — reviewer rejected the submission. `reviewed_by`, `reviewed_at`, `denial_reason` set. The company must submit a new report (new row) — this denied row **stays forever** as audit.
- **`APPROVED`** — reviewer accepted. `approved_at` set, `valid_until = approved_at + 3 years`. A `public_report` row is inserted as part of this transition.
- **`SUPERSEDED`** — a newer report from the same company has been approved. Old `valid_until` gets stamped to `now()`. Only one `APPROVED` report per company is "current" at any time.

## Resubmission

A resubmission is always a **new row** in `report`. It is never an update of an existing report. The new row's `previous_report_id` points to the report being replaced (the denied one, or the expiring approved one). Children (`report_criterion`, `report_employee`, `report_result`, etc.) belong to the new row — old children stay with the old row.

Two resubmission triggers:

1. **Denial** — reviewer denied the current submission. Company edits, re-submits as a new `DRAFT` → `SUBMITTED` row.
2. **Three-year expiry** — approved report is aging out. Companies are notified ~3 months before `valid_until`. A new report is drafted and submitted. On approval, the old report transitions to `SUPERSEDED`.

## Public snapshot flow

On the `APPROVED` transition, the system inserts a row into `public_report`. This row is:

- **Anonymized** — no company name, no national ID, no personal data. Only `size_bucket`, `isat_category`, and precomputed salary aggregates.
- **Detached** — `source_report_id` exists for internal traceability but is never exposed on the public API.
- **Immutable** — insert-only, no `updated_at`, no `deleted_at`. Once published, it stays as-is.
- **Precomputed** — all six directional `salary_diff_*` permutations are written. The public site does zero math; it just renders.

If a mistake is discovered post-publication, the retraction flow (TBD) kicks in. Until that's designed, assume public rows are permanent.

## Fines accrual

A company that misses its deadline accrues daily fines.

- Reviewer sets `report.fines_started_at` in the UI when a company has failed to submit or has submitted something incomplete.
- A daily cron iterates reports where `fines_started_at IS NOT NULL AND status NOT IN ('APPROVED', 'SUPERSEDED')` and writes a fine row per day. (The `report_fine` accrual table is not yet designed.)
- Grace is implicit: once the report transitions to `APPROVED` (or `SUPERSEDED`), the filter excludes it and accrual stops.

## Daughter companies

Large companies often report on behalf of their corporate group. The `company_report` M:M table captures this:

- One row per (company, report) pair.
- `company_parent_id` (nullable) points to the parent company in the group. A row with `company_parent_id = NULL` is the top-level reporter; rows with it set are subsidiaries.
- All employees of all companies in the group are listed on the same `report`. Reviewers see the full company list by reading `company_report` for that report.

The schema does **not** track which specific company paid which specific employee. Aggregate visibility (the list of participating companies) is sufficient for the audit.

## Criteria scoring (how a report is evaluated)

Each report is evaluated against a set of weighted criteria:

- `report_criterion` — top-level buckets (e.g. "equal pay for equal work"). Each has a `weight` and a `type` (`STATIC`, `CONDITION`, `CONTINUOUS`, `PERSONAL`).
- `report_sub_criterion` — sub-buckets within a criterion, also weighted.
- `report_sub_criterion_step` — ordered scoring steps within a sub-criterion. Each step has a `score`.
- Which steps apply to which role is captured in `report_employee_role_criterion_step`.
- Which steps apply to a specific employee personally is captured in `report_employee_personal_criterion_step`.
- Deviations from the standard evaluation (special circumstances for a specific employee) are recorded in `report_employee_deviation` with `reason`, `action`, and signatures.

The final `score` on `report_employee` is derived from the steps that apply to that employee.

## Results aggregation

`report_result` holds report-level salary aggregates (overall avg/min/max/mid, per-gender breakdowns, and six directional salary gap pairs). `report_role_result` holds the same breakdown per role. Both tables are write-once per approval — computed as part of the approval pipeline, not edited by humans.

## Enums

| Enum | Values |
|------|--------|
| `GenderEnum` | `MALE`, `FEMALE`, `NEUTRAL` |
| `ReportProviderEnum` | `SYSTEM`, `ISLAND_IS`, `OTHER` |
| `ReportCriterionTypeEnum` | `RESPONSIBILITY`, `STRAIN`, `CONDITION`, `COMPETENCE`, `PERSONAL` |
| `EducationEnum` | `COMPULSORY`, `UPPER_SECONDARY`, `VOCATIONAL`, `BACHELOR`, `MASTER`, `DOCTORATE`, `PROFESSIONAL` |
| `ReportStatusEnum` | `DRAFT`, `SUBMITTED`, `IN_REVIEW`, `DENIED`, `APPROVED`, `SUPERSEDED` |

### `EducationEnum` — Iceland to Western mapping

Salary equality reports can be submitted by both Icelandic-resident employees and foreign staff, so education levels are stored in a Western-generic enum rather than raw Icelandic school names. The mapping follows [UNESCO ISCED 2011](https://uis.unesco.org/en/topic/international-standard-classification-education-isced) (the international standard for classifying education levels) so translation to/from other countries is unambiguous.

| Enum value | ISCED | Icelandic | English (approx.) |
|------------|-------|-----------|-------------------|
| `COMPULSORY` | 1–2 | grunnskóli | Primary + lower secondary (compulsory, ages 6–16) |
| `UPPER_SECONDARY` | 3 | menntaskóli / framhaldsskóli (general track) | Upper secondary / high school |
| `VOCATIONAL` | 3–4 | iðnskóli / iðnnám / starfsnám | Vocational or trade education (welder, electrician, hairdresser, etc.) |
| `BACHELOR` | 6 | háskóli (BA / BS / B.Ed) | University undergraduate degree |
| `MASTER` | 7 | háskóli (MA / MS / M.Ed / integrated master) | University graduate degree |
| `DOCTORATE` | 8 | háskóli (PhD / doktorsgráða) | Research doctorate |
| `PROFESSIONAL` | post-6, non-ISCED-standard | sérfræðinám / sérnám | Specialized post-tertiary certification (medical specialty, chartered accounting, bar exam, etc.) — not a research degree but above bachelor level |

Notes for reviewers mapping a CV:
- A candidate who finished only grunnskóli (no further schooling) → `COMPULSORY`.
- Someone who completed menntaskóli but not university → `UPPER_SECONDARY`.
- A trained electrician / plumber / hairdresser who went through iðnnám → `VOCATIONAL`, even if they also attended menntaskóli alongside.
- BA + MA as separate steps → use highest (`MASTER`). Integrated 5-year master's → `MASTER`.
- MA followed by a specialist certification → use highest degree held. If the specialist certification is the top qualification (no MA), use `PROFESSIONAL`.
- When in doubt between two values, pick the **higher** level the employee actually completed, not the one they're currently studying.

## Naming conventions

- **Singular table names** (`report`, `company`, `user`, `report_employee`, ...). One row = one entity, which maps 1:1 to the ORM class name (`ReportModel` ↔ `report`) and avoids the mental flip when reading code vs. SQL.
- **No app-level prefix** (e.g. no `doe_` in front of every table). The schema lives in its own DB namespace for this service — cross-app collisions aren't a concern here.
- **FK columns use `<referenced_table>_id`** (e.g. `report_id`, `report_criterion_id`, `reviewed_by` points to `user`).
- **Join tables are also singular**, named after both sides or their relationship (e.g. `company_report`, `report_employee_role_criterion_step`).
- **Latin plurals normalized to singular** — `criteria` → `criterion`, `results` → `result`. Even when awkward to English ear, consistency wins.
- **Enums named in PascalCase with `Enum` suffix** (`GenderEnum`, `ReportStatusEnum`). This doc keeps enum casing as-is (not singularized).

Repo-wide context: other DMR apps (Legal Gazette, Official Journal) have historically mixed singular and plural table names. DoE chose strict singular for this service — no retroactive renames expected in the other schemas.

## Common columns

Default (most tables):

| Column | Type |
|--------|------|
| `created_at` | `timestamp` |
| `updated_at` | `timestamp` |

No `deleted_at`. Report lifecycle handled via `report.status` enum — children filtered via parent report status, never soft-deleted independently.

Exceptions:
- **Join tables** (`company_report`, `report_employee_role_criterion_step`, `report_employee_personal_criterion_step`): only `created_at`. Join rows don't mutate — existence is the state.
- **`public_report`**: insert-only, `created_at` only. No `updated_at`. Retraction flow deferred (see Notes).

## Tables

### `user`
DoE staff (reviewers). Matches convention used by other apps in the repo (e.g. `legal-gazette-api/users`). Company admins are **not** captured here — their identity is cached as raw fields on `report` at submission time.

| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `national_id` | `text` (unique) |
| `first_name` | `text` |
| `last_name` | `text` |
| `email` | `text` (unique) |
| `phone` | `text` (nullable) |

### `company`
| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `name` | `text` |
| `address` | `text` |
| `city` | `text` |
| `postcode` | `text` |
| `employee_count` | `int` |
| `national_id` | `text` |
| `isat_category` | `text` |

### `company_report` (M:M)
Join table between `company` and `report`. `company_parent_id` allows a parent company to be linked alongside a subsidiary.

| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `company_id` | `fk → company` |
| `report_id` | `fk → report` |
| `company_parent_id` | `fk → company` (nullable) |

### `report`
| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `company_admin_name` | `text` |
| `company_admin_email` | `text` |
| `company_admin_gender` | `GenderEnum` |
| `contact_name` | `text` |
| `contact_email` | `text` |
| `contact_phone` | `text` |
| `avg_emp_mcount` | `num` |
| `avg_emp_fcount` | `num` |
| `avg_emp_ocount` | `num` |
| `provider_type` | `ReportProviderEnum` |
| `provider_id` | `text` (nullable) |
| `imported_from_excel` | `boolean` |
| `identifier` | `text` |
| `status` | `ReportStatusEnum` |
| `previous_report_id` | `fk → report` (nullable, chain for resubmissions) |
| `submitted_at` | `timestamp` (nullable) |
| `reviewed_by` | `fk → user` (nullable) |
| `reviewed_at` | `timestamp` (nullable) |
| `denial_reason` | `text` (nullable) |
| `approved_at` | `timestamp` (nullable) |
| `valid_until` | `timestamp` (nullable — approved_at + 3y; stamped `now()` on supersede) |
| `due_date` | `date` (nullable — inherited from prior report's `valid_until`) |
| `fines_started_at` | `date` (nullable — admin-set, triggers daily fine accrual cron) |

### `report_criterion`
| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `title` | `text` |
| `weight` | `float` |
| `description` | `text` |
| `type` | `ReportCriterionTypeEnum` |
| `report_id` | `fk → report` |

### `report_sub_criterion`
| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `title` | `text` |
| `desc` | `text` |
| `weight` | `float` |
| `report_criterion_id` | `fk → report_criterion` |

### `report_sub_criterion_step`
| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `order` | `num` |
| `description` | `text` |
| `report_sub_criterion_id` | `fk → report_sub_criterion` |
| `score` | `float` |

### `report_employee`
| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `index` | `num` |
| `education` | `EducationEnum` |
| `field` | `text` |
| `department` | `text` |
| `start_date` | `date` |
| `work_ratio` | `float` |
| `base_salary` | `num` |
| `additional_salary` | `num` |
| `bonus_salary` | `num` (nullable) |
| `gender` | `GenderEnum` |
| `role_id` | `fk → report_employee_role` |
| `report_id` | `fk → report` |
| `score` | `num` |

### `report_employee_role`
| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `title` | `text` |

### `report_employee_deviation`
| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `emp_id` | `fk → report_employee` |
| `reason` | `text` |
| `action` | `text` |
| `signature_name` | `text` |
| `signature_role` | `text` |

### `report_employee_role_criterion_step`
Join: which sub-criteria steps apply to a given role.

| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `role_id` | `fk → report_employee_role` |
| `step_id` | `fk → report_sub_criterion_step` |

### `report_employee_personal_criterion_step`
Join: which sub-criteria steps apply to a given employee personally.

| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `employee_id` | `fk → report_employee` |
| `step_id` | `fk → report_sub_criterion_step` |

### `report_result`
Aggregated per-report salary stats.

| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `report_id` | `fk → report` |
| `avg_male_salary` | `num` |
| `avg_female_salary` | `num` |
| `avg_neutral_salary` | `num` |
| `avg_salary` | `num` |
| `min_salary` | `num` |
| `max_salary` | `num` |
| `mid_salary` | `num` |
| `salary_diff_male_female` | `num` |
| `salary_diff_male_neutral` | `num` |
| `salary_diff_female_male` | `num` |
| `salary_diff_female_neutral` | `num` |
| `salary_diff_neutral_male` | `num` |
| `salary_diff_neutral_female` | `num` |

### `report_role_result`
Same salary stats broken down per role. Whiteboard used ditto marks (`==`) — expanded below.

| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `report_result_id` | `fk → report_result` |
| `role_id` | `fk → report_employee_role` |
| `avg_salary` | `num` |
| `min_salary` | `num` |
| `max_salary` | `num` |
| `mid_salary` | `num` |
| `avg_male_salary` | `num` |
| `avg_female_salary` | `num` |
| `avg_neutral_salary` | `num` |
| `min_male_salary` | `num` |
| `min_female_salary` | `num` |
| `min_neutral_salary` | `num` |
| `max_male_salary` | `num` |
| `max_female_salary` | `num` |
| `max_neutral_salary` | `num` |

### `public_report`
Insert-only snapshot published when a private report is approved. No PII, no FK to `company`. Anonymized aggregate shown on public site. Immutable by design.

| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `source_report_id` | `fk → report` (internal trace only, not exposed publicly) |
| `size_bucket` | `text` (company size bracket, e.g. `50-99`, `100+`) |
| `isat_category` | `text` (industry field) |
| `published_at` | `timestamp` |
| `valid_until` | `timestamp` |
| `avg_male_salary` | `num` |
| `avg_female_salary` | `num` |
| `avg_neutral_salary` | `num` |
| `salary_diff_male_female` | `num` |
| `salary_diff_male_neutral` | `num` |
| `salary_diff_female_male` | `num` |
| `salary_diff_female_neutral` | `num` |
| `salary_diff_neutral_male` | `num` |
| `salary_diff_neutral_female` | `num` |

Full six permutations precomputed — public consumer does no math. Exact aggregate column set still TBD — min/max/mid and role-level breakdown probably omitted, confirm with stakeholders.

## Relationships (summary)

- `company` ⟷ `report` via `company_report` (M:M, with optional parent company).
- `report` 1:N `report_criterion` 1:N `report_sub_criterion` 1:N `report_sub_criterion_step`.
- `report` 1:N `report_employee` N:1 `report_employee_role`.
- `report_employee` 1:N `report_employee_deviation`.
- `report_employee_role` ⟷ `report_sub_criterion_step` via `report_employee_role_criterion_step`.
- `report_employee` ⟷ `report_sub_criterion_step` via `report_employee_personal_criterion_step`.
- `report` 1:1 `report_result` 1:N `report_role_result` N:1 `report_employee_role`.
- `report` 1:N `public_report` (one public snapshot per approval; new approvals insert new rows).
- `report` → `report` self-ref via `previous_report_id` (resubmission chain).
- `report` N:1 `user` via `reviewed_by` (DoE reviewer who accepted/denied).

## Notes / open questions

- **Retraction flow deferred.** If a critical error surfaces in an already-approved public report, flow TBD. `ReportStatusEnum` is open for a future `RETRACTED` value; `public_report` columns for retraction (e.g. `retracted_at`, `retraction_reason`, `replaced_by_id`) not added yet.
- **Fines cron.** Daily job: `SELECT * FROM report WHERE fines_started_at IS NOT NULL AND status NOT IN ('APPROVED', 'SUPERSEDED')`. Accrual table (`report_fine` or similar) not yet designed.
- **Scope.** This schema targets companies with ≥50 employees. Smaller-company flows + edge cases (mergers, liquidation, exemptions) TBD.
- **Cascade vs soft-delete.** Postgres `ON DELETE CASCADE` only fires on real `DELETE` rows. Lifecycle here is status-based, not soft-delete — do not add `deleted_at` to children expecting cascade propagation.
