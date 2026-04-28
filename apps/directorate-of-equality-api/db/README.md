# DoE DB Schema

> Visual ER diagram: [`DIAGRAM.md`](./DIAGRAM.md)

## Overview

This database backs the Directorate of Equality (DoE) salary equality reporting system. Every Icelandic company with **50 or more employees** is required by law to submit a salary equality report. DoE reviewers audit each report, approve or reject it, and publish an anonymized summary of every approved report to a public site. Approved reports are valid for **three years**, after which the company must resubmit.

Scope of this schema: the ≥50-employee flow only. Smaller-company flows and edge cases (mergers, exemptions, liquidations) are out of scope for now.

## Report types

`report.type` (`ReportTypeEnum`) splits submissions into two distinct kinds that share the same lifecycle, reviewer flow, and public-snapshot pipeline but differ in payload:

- **`SALARY`** — structured equal-pay report. Uses the full set of demographic, criterion, employee, and aggregate tables (`report_criterion`, `report_sub_criterion`, `report_employee`, `report_result`, etc.). Employee counts and aggregate columns on `report` are populated.
- **`EQUALITY`** — narrative gender-equality plan. Stored as free-form text in `equality_report_content`. The structured child tables and aggregate columns are not populated for this type.

Columns on `report` that are specific to one type (demographic counts, `equality_report_content`) are nullable and should be populated based on `type`.

**Gating rule — equality precedes salary.** Every company must submit an `EQUALITY` report. Only companies flagged by `salary_report_required` must additionally submit a `SALARY` report, and a `SALARY` row cannot be submitted until a matching `EQUALITY` row exists with `status = 'APPROVED'` and `valid_until > now()`. The dependency is captured on the salary row via `equality_report_id` — a self-FK back to `report` that points to the approved equality the salary was audited against. Snapshot, not tracking: once set it's never rewired, so later supersedes of the equality don't rewrite the salary's audit trail.

Invariants the FK implies (enforce via CHECK + trigger, not by plain FK alone):

- `equality_report_id IS NOT NULL` ⇒ `type = 'SALARY'`.
- Referenced row must have `type = 'EQUALITY'` and must have been `APPROVED` (not just `SUBMITTED`) at the moment the salary row was inserted.

## Actors

- **Company admin** — fills out and submits reports on behalf of a company. In parent/subsidiary groups, one company acts as the parent and reports on its daughter companies in the same submission.
- **DoE reviewer (admin)** — reads submitted reports, denies with reason, approves when valid, flags fine accrual. Identified by a row in the `doe_user` table.
- **Public consumer** — browses anonymized aggregates on the public site. Has no access to PII or to denied/draft reports.

## Eligibility

Every company must submit an `EQUALITY` report — no gating column, no exceptions. `company.salary_report_required` gates only the additional `SALARY` submission. A database trigger on `company` insert/update keeps it in sync with the RSK-reported headcount:

- `average_employee_count_from_rsk >= 50` → trigger sets `salary_report_required = true`.
- `average_employee_count_from_rsk < 50` → trigger sets `salary_report_required = false`.

`salary_report_required_override` marks rows whose flag has been set manually (e.g. institutions that must report regardless of headcount, or any other case where the law-by-headcount rule doesn't apply). When `salary_report_required_override = true`, the trigger skips the row entirely — the manual value stands even as the RSK count crosses the 50-threshold in either direction.

## Report lifecycle

`report.status` drives every transition. Resubmissions are new rows; there is no FK chain back to the prior submission.

```
  DRAFT  ──submit──▶  SUBMITTED  ──pickup──▶  IN_REVIEW
                                                  │
                       ┌──────────────────────────┤
                       ▼                          ▼
                    DENIED                     APPROVED
                       │                          │
                       │ (resubmit = new DRAFT    │ (3yr later, or on new approval)
                       │  row, no FK chain)       ▼
                       │                       SUPERSEDED
                       ▼
                  (new DRAFT row)
```

State-by-state:

- **`DRAFT`** — company admin is still editing. Not visible to reviewers. Most columns may be null. Can transition to `SUBMITTED`.
- **`SUBMITTED`** — company finalized the submission. `submitted_at` stamped. Waits in reviewer queue.
- **`IN_REVIEW`** — a reviewer has picked up the report. (If you want reviewer-assignment tracking, stamp `reviewer_user_id` on pickup; currently it's stamped on the final decision.)
- **`DENIED`** — reviewer rejected the submission. `reviewer_user_id` set on the report. Denial reason is stored on the `STATUS_CHANGED` event (`reason` column) rather than the report row — keeps the audit trail self-contained. The company must submit a new report (new row) — this denied row **stays forever** as audit.
- **`APPROVED`** — reviewer accepted. `approved_at` set, `valid_until = approved_at + 3 years`. A `public_report` row is inserted as part of this transition.
- **`SUPERSEDED`** — a newer report from the same company has been approved. Old `valid_until` gets stamped to `now()`. Only one `APPROVED` report per company is "current" at any time.

## Resubmission

A resubmission is always a **new row** in `report`. It is never an update of an existing report. There is no FK linking the new row back to the one it replaces — old and new are correlated via `company_report.company_id` + `submitted_at` ordering, not a direct reference. Children (`report_criterion`, `report_employee`, `report_result`, etc.) belong to the new row — old children stay with the old row.

Two resubmission triggers:

1. **Denial** — reviewer denied the current submission. Company edits, re-submits as a new `DRAFT` → `SUBMITTED` row.
2. **Three-year expiry** — approved report is aging out. Companies are notified ~3 months before `valid_until`. A new report is drafted and submitted. On approval, the old report transitions to `SUPERSEDED`.

## Audit timeline (events + comments)

Two parallel streams capture what happens to a report after draft. The admin UI renders them as a unified, per-status-bucket timeline.

- **`report_event`** — immutable, system-generated audit rows. Emitted on state-changing actions: submission, reviewer assignment, status transitions (future: fines started, retraction). Never edited, never deleted.
- **`report_comment`** — human-written messages. Either **internal** (reviewer-to-reviewer, hidden from the company) or **external** (reviewer ↔ company admin, visible to both sides). Company admins can post on external comments only.

### Mutability

- Events are insert-only. No edits, no deletes.
- Comments are **immutable after insert** (no edit flow). Authors may soft-delete their own comment (`deleted_at` stamped); deleted rows are hidden entirely from the rendered thread — no tombstone. Reviewers delete only their own comments; company admins ditto. System events cannot be deleted regardless of actor.

### Author model

- `report_event.actor_user_id` — fk → `doe_user` (nullable). Null means company admin (e.g. `SUBMITTED`) or cron/system.
- `report_comment.author_kind` — `REVIEWER` or `COMPANY_ADMIN`:
  - `REVIEWER` → `author_user_id` points to the reviewer's `doe_user` row.
  - `COMPANY_ADMIN` → `author_user_id` is null; display identity is hydrated from the parent `report.company_admin_*` cached fields. Company admins are intentionally not captured in `doe_user` (see Tables → `doe_user`).

### Visibility

- `report_event` is reviewer-facing only. Company admins don't see the event stream.
- `report_comment.visibility`:
  - `INTERNAL` — reviewer-only. Valid only when `author_kind = REVIEWER`.
  - `EXTERNAL` — visible to reviewers and the company admin. Both sides can post.

Notification / email side effect on `EXTERNAL` insert is a service-layer concern, not modeled in the schema.

### Timeline grouping by status

Both tables carry a `report_status` snapshot stamped at insert time. The admin UI groups the timeline into buckets per lifecycle state (`DRAFT`, `SUBMITTED`, `IN_REVIEW`, …).

- For regular events and all comments, `report_status = report.status` at the moment of insert.
- For `STATUS_CHANGED` events, `report_status = to_status` — the transition row opens the bucket for the new status rather than closing the old one, so each bucket reads top-down starting with "moved to X".

The snapshot never mutates; buckets remain stable as the report moves through later states.

## Public snapshot flow

On the `APPROVED` transition, the system inserts a row into `public_report`. This row is:

- **Anonymized** — no company name, no national ID, no personal data. Only `size_bucket`, `isat_category`, and precomputed salary aggregates.
- **Detached** — `source_report_id` exists for internal traceability but is never exposed on the public API.
- **Immutable** — insert-only, no `updated_at`, no `deleted_at`. Once published, it stays as-is.
- **Precomputed** — all six directional `salary_difference_*` permutations are written. The public site does zero math; it just renders.

If a mistake is discovered post-publication, the retraction flow (TBD) kicks in. Until that's designed, assume public rows are permanent.

## Fines accrual

A company that misses its deadline accrues daily fines.

- Reviewer sets `report.fines_started_at` in the UI when a company has failed to submit or has submitted something incomplete.
- A daily cron iterates reports where `fines_started_at IS NOT NULL AND status NOT IN ('APPROVED', 'SUPERSEDED')` and writes a fine row per day. (The `report_fine` accrual table is not yet designed.)
- Grace is implicit: once the report transitions to `APPROVED` (or `SUPERSEDED`), the filter excludes it and accrual stops.

## Daughter companies

Large companies often report on behalf of their corporate group. The `company_report` table captures this — one row per participating company per submission, with the company's identity and demographics (name, national ID, address, headcount, ISAT category) snapshotted so later mutations to `company` don't rewrite history:

- One row per (company, report) pair.
- `parent_company_id` (nullable) points to the parent company in the group. A row with `parent_company_id = NULL` is the top-level reporter; rows with it set are subsidiaries.
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

The final `score` on `report_employee` is derived from the steps that apply to that employee — the sum of `report_sub_criterion_step.score` across the steps reachable via the employee's role (`report_employee_role_criterion_step`) and via their personal assignments (`report_employee_personal_criterion_step`), with steps assigned through both sources counted once. The total is computed at submission and persisted on the row; reviewers read it as-is.

## Results aggregation

`report_result` holds immutable report-level salary snapshots for both **adjusted base salary** (`baseSalary / workRatio`) and **adjusted full salary** (`(baseSalary + additionalSalary + bonusSalary) / workRatio`). The snapshots are stored as JSONB because the service reads results by `report_id` rather than querying individual metrics in SQL. Each salary family stores report-level totals and score-bucket breakdowns. `report_role_result` is kept as the reserved home for a future role-level breakdown and snapshots the role title used at calculation time. Both tables are write-once at submission — computed in the same transaction that persists the report, so reviewers can read the aggregates as soon as they pick the report up. They are not edited by humans, and the approval transition does not recompute them. (Contrast with `public_report`, which is published only on the `APPROVED` transition.)

## Enums

| Enum                      | Values                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `GenderEnum`              | `MALE`, `FEMALE`, `NEUTRAL`                                                                      |
| `ReportProviderEnum`      | `SYSTEM`, `ISLAND_IS`, `OTHER`                                                                   |
| `ReportCriterionTypeEnum` | `RESPONSIBILITY`, `STRAIN`, `CONDITION`, `COMPETENCE`, `PERSONAL`                                |
| `EducationEnum`           | `COMPULSORY`, `UPPER_SECONDARY`, `VOCATIONAL`, `BACHELOR`, `MASTER`, `DOCTORATE`, `PROFESSIONAL` |
| `ReportStatusEnum`        | `DRAFT`, `SUBMITTED`, `IN_REVIEW`, `DENIED`, `APPROVED`, `SUPERSEDED`                            |
| `ReportTypeEnum`          | `SALARY`, `EQUALITY`                                                                             |
| `ReportEventTypeEnum`     | `SUBMITTED`, `ASSIGNED`, `STATUS_CHANGED`, `SUPERSEDED`                                          |
| `CommentVisibilityEnum`   | `INTERNAL`, `EXTERNAL`                                                                           |
| `CommentAuthorKindEnum`   | `REVIEWER`, `COMPANY_ADMIN`                                                                      |

### `EducationEnum` — Iceland to Western mapping

Salary equality reports can be submitted by both Icelandic-resident employees and foreign staff, so education levels are stored in a Western-generic enum rather than raw Icelandic school names. The mapping follows [UNESCO ISCED 2011](https://uis.unesco.org/en/topic/international-standard-classification-education-isced) (the international standard for classifying education levels) so translation to/from other countries is unambiguous.

| Enum value        | ISCED                      | Icelandic                                    | English (approx.)                                                                                                                                  |
| ----------------- | -------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `COMPULSORY`      | 1–2                        | grunnskóli                                   | Primary + lower secondary (compulsory, ages 6–16)                                                                                                  |
| `UPPER_SECONDARY` | 3                          | menntaskóli / framhaldsskóli (general track) | Upper secondary / high school                                                                                                                      |
| `VOCATIONAL`      | 3–4                        | iðnskóli / iðnnám / starfsnám                | Vocational or trade education (welder, electrician, hairdresser, etc.)                                                                             |
| `BACHELOR`        | 6                          | háskóli (BA / BS / B.Ed)                     | University undergraduate degree                                                                                                                    |
| `MASTER`          | 7                          | háskóli (MA / MS / M.Ed / integrated master) | University graduate degree                                                                                                                         |
| `DOCTORATE`       | 8                          | háskóli (PhD / doktorsgráða)                 | Research doctorate                                                                                                                                 |
| `PROFESSIONAL`    | post-6, non-ISCED-standard | sérfræðinám / sérnám                         | Specialized post-tertiary certification (medical specialty, chartered accounting, bar exam, etc.) — not a research degree but above bachelor level |

Notes for reviewers mapping a CV:

- A candidate who finished only grunnskóli (no further schooling) → `COMPULSORY`.
- Someone who completed menntaskóli but not university → `UPPER_SECONDARY`.
- A trained electrician / plumber / hairdresser who went through iðnnám → `VOCATIONAL`, even if they also attended menntaskóli alongside.
- BA + MA as separate steps → use highest (`MASTER`). Integrated 5-year master's → `MASTER`.
- MA followed by a specialist certification → use highest degree held. If the specialist certification is the top qualification (no MA), use `PROFESSIONAL`.
- When in doubt between two values, pick the **higher** level the employee actually completed, not the one they're currently studying.

## Naming conventions

- **Singular table names** (`report`, `company`, `report_employee`, ...). One row = one entity, which maps 1:1 to the ORM class name (`ReportModel` ↔ `report`) and avoids the mental flip when reading code vs. SQL.
- **No app-level prefix** (e.g. no `doe_` in front of every table). The schema lives in its own DB namespace for this service — cross-app collisions aren't a concern here. **Exception:** `doe_user` is prefixed because `user` is a reserved word in Postgres.
- **FK columns use `<referenced_table>_id`** (e.g. `report_id`, `report_criterion_id`, `reviewer_user_id` points to `doe_user`). For `doe_user`, FK columns drop the `doe_` prefix (`reviewer_user_id`, not `reviewer_doe_user_id`) since `user_id` is unambiguous in context.
- **Join tables are also singular**, named after both sides or their relationship (e.g. `company_report`, `report_employee_role_criterion_step`).
- **Latin plurals normalized to singular** — `criteria` → `criterion`, `results` → `result`. Even when awkward to English ear, consistency wins.
- **Enums named in PascalCase with `Enum` suffix** (`GenderEnum`, `ReportStatusEnum`). This doc keeps enum casing as-is (not singularized).

Repo-wide context: other DMR apps (Legal Gazette, Official Journal) have historically mixed singular and plural table names. DoE chose strict singular for this service — no retroactive renames expected in the other schemas.

## Common columns

Default (most tables):

| Column       | Type        |
| ------------ | ----------- |
| `created_at` | `timestamp` |
| `updated_at` | `timestamp` |

No `deleted_at`. Report lifecycle handled via `report.status` enum — children filtered via parent report status, never soft-deleted independently.

Exceptions:

- **Join tables** (`company_report`, `report_employee_role_criterion_step`, `report_employee_personal_criterion_step`): only `created_at`. Join rows don't mutate — existence is the state.
- **`public_report`**: insert-only, `created_at` only. No `updated_at`. Retraction flow deferred (see Notes).
- **`report_event`**: insert-only, `created_at` only. Immutable audit row — never edited, never deleted.
- **`report_comment`**: `created_at` + `updated_at` + `deleted_at`. Comments are immutable after insert in application logic (no edit endpoint) — `updated_at` is present only to fit the `ParanoidModel` base shape. Soft-delete hides the row from the rendered thread (no tombstone).

## Tables

### `doe_user`

DoE staff (reviewers). Matches convention used by other apps in the repo (e.g. `legal-gazette-api/users`). Company admins are **not** captured here — their identity is cached as raw fields on `report` at submission time.

| Column        | Type                       |
| ------------- | -------------------------- |
| `id`          | `uuid` PK                  |
| `national_id` | `text` (unique)            |
| `first_name`  | `text`                     |
| `last_name`   | `text`                     |
| `email`       | `text` (unique)            |
| `phone`       | `text` (nullable)          |
| `is_active`   | `boolean` (default `true`) |

### `company`

| Column                            | Type      |
| --------------------------------- | --------- |
| `id`                              | `uuid` PK |
| `name`                            | `text`    |
| `address`                         | `text`    |
| `city`                            | `text`    |
| `postcode`                        | `text`    |
| `average_employee_count_from_rsk` | `int`     |
| `national_id`                     | `text`    |
| `isat_category`                   | `text`    |
| `salary_report_required`          | `boolean` |
| `salary_report_required_override` | `boolean` |

### `company_report`

Submission-time snapshot of a company participating in a report. `company_id` points to the current (mutable) row in `company`; all identity and demographic fields are frozen at submission so audits reflect the company as it looked then, not as it looks now. `parent_company_id` allows a parent company to be linked alongside a subsidiary. The `salary_report_required*` flags are admin/gating state, not historical data, and are intentionally not snapshotted — read them off `company`.

| Column                            | Type                            |
| --------------------------------- | ------------------------------- |
| `id`                              | `uuid` PK                       |
| `company_id`                      | `fk → company`                  |
| `report_id`                       | `fk → report`                   |
| `parent_company_id`               | `fk → company` (nullable)       |
| `name`                            | `text` (snapshot at submission) |
| `national_id`                     | `text` (snapshot at submission) |
| `address`                         | `text` (snapshot at submission) |
| `city`                            | `text` (snapshot at submission) |
| `postcode`                        | `text` (snapshot at submission) |
| `average_employee_count_from_rsk` | `int` (snapshot at submission)  |
| `isat_category`                   | `text` (snapshot at submission) |

### `report`

| Column                           | Type                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `id`                             | `uuid` PK                                                                                                                      |
| `type`                           | `ReportTypeEnum`                                                                                                               |
| `company_admin_name`             | `text`                                                                                                                         |
| `company_admin_email`            | `text`                                                                                                                         |
| `company_admin_gender`           | `GenderEnum`                                                                                                                   |
| `contact_name`                   | `text`                                                                                                                         |
| `contact_national_id`            | `text`                                                                                                                         |
| `contact_email`                  | `text`                                                                                                                         |
| `contact_phone`                  | `text`                                                                                                                         |
| `average_employee_male_count`    | `decimal(10, 2)`                                                                                                               |
| `average_employee_female_count`  | `decimal(10, 2)`                                                                                                               |
| `average_employee_neutral_count` | `decimal(10, 2)`                                                                                                               |
| `provider_type`                  | `ReportProviderEnum`                                                                                                           |
| `provider_id`                    | `text` (nullable)                                                                                                              |
| `imported_from_excel`            | `boolean`                                                                                                                      |
| `identifier`                     | `text`                                                                                                                         |
| `status`                         | `ReportStatusEnum`                                                                                                             |
| `equality_report_id`             | `fk → report` (nullable — set on `type = SALARY` rows, points to the approved equality report this salary was audited against) |
| `reviewer_user_id`               | `fk → doe_user` (nullable)                                                                                                     |
| `approved_at`                    | `timestamp` (nullable)                                                                                                         |
| `valid_until`                    | `timestamp` (nullable — approved_at + 3y; stamped `now()` on supersede)                                                        |
| `correction_deadline`            | `timestamp` (nullable)                                                                                                         |
| `equality_report_content`        | `text` (nullable — narrative body for `type = EQUALITY`)                                                                       |

### `report_criterion`

| Column        | Type                      |
| ------------- | ------------------------- |
| `id`          | `uuid` PK                 |
| `title`       | `text`                    |
| `weight`      | `decimal(6, 4)`           |
| `description` | `text`                    |
| `type`        | `ReportCriterionTypeEnum` |
| `report_id`   | `fk → report`             |

### `report_sub_criterion`

| Column                | Type                    |
| --------------------- | ----------------------- |
| `id`                  | `uuid` PK               |
| `title`               | `text`                  |
| `description`         | `text`                  |
| `weight`              | `decimal(6, 4)`         |
| `report_criterion_id` | `fk → report_criterion` |

### `report_sub_criterion_step`

| Column                    | Type                        |
| ------------------------- | --------------------------- |
| `id`                      | `uuid` PK                   |
| `order`                   | `int`                       |
| `description`             | `text`                      |
| `report_sub_criterion_id` | `fk → report_sub_criterion` |
| `score`                   | `decimal(6, 2)`             |

### `report_employee`

| Column                    | Type                        |
| ------------------------- | --------------------------- |
| `id`                      | `uuid` PK                   |
| `ordinal`                 | `int`                       |
| `education`               | `EducationEnum`             |
| `field`                   | `text`                      |
| `department`              | `text`                      |
| `start_date`              | `date`                      |
| `work_ratio`              | `decimal(5, 4)`             |
| `base_salary`             | `decimal(14, 2)`            |
| `additional_salary`       | `decimal(14, 2)`            |
| `bonus_salary`            | `decimal(14, 2)` (nullable) |
| `gender`                  | `GenderEnum`                |
| `report_employee_role_id` | `fk → report_employee_role` |
| `report_id`               | `fk → report`               |
| `score`                   | `decimal(6, 2)`             |

### `report_employee_role`

| Column  | Type      |
| ------- | --------- |
| `id`    | `uuid` PK |
| `title` | `text`    |

### `report_employee_deviation`

| Column               | Type                   |
| -------------------- | ---------------------- |
| `id`                 | `uuid` PK              |
| `report_employee_id` | `fk → report_employee` |
| `reason`             | `text`                 |
| `action`             | `text`                 |
| `signature_name`     | `text`                 |
| `signature_role`     | `text`                 |

### `report_employee_role_criterion_step`

Join: which sub-criteria steps apply to a given role.

| Column                         | Type                             |
| ------------------------------ | -------------------------------- |
| `id`                           | `uuid` PK                        |
| `report_employee_role_id`      | `fk → report_employee_role`      |
| `report_sub_criterion_step_id` | `fk → report_sub_criterion_step` |

### `report_employee_personal_criterion_step`

Join: which sub-criteria steps apply to a given employee personally.

| Column                         | Type                             |
| ------------------------------ | -------------------------------- |
| `id`                           | `uuid` PK                        |
| `report_employee_id`           | `fk → report_employee`           |
| `report_sub_criterion_step_id` | `fk → report_sub_criterion_step` |

### `report_result`

Aggregated per-report salary stats. Stored as an immutable calculation snapshot.

| Column                                | Type                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `id`                                  | `uuid` PK                                                                     |
| `report_id`                           | `fk → report` (unique)                                                        |
| `salary_difference_threshold_percent` | `decimal(5, 2)` nullable threshold snapshot from `config` at time of creation |
| `calculation_version`                 | `text` (default `v1`)                                                         |
| `base_snapshot`                       | `jsonb` adjusted base salary snapshot                                         |
| `full_snapshot`                       | `jsonb` adjusted full salary snapshot                                         |

`base_snapshot` and `full_snapshot` share the same shape:

- `totals`
  - `overall`, `male`, `female`, `neutral` — each contains `average`, `median`, `minimum`, `maximum`.
  - `salaryDifferences` — contains `maleFemale`, `maleNeutral`, `femaleMale`, `femaleNeutral`, `neutralMale`, `neutralFemale`.
- `scoreBuckets[]`
  - `rangeFrom`, `rangeTo`
  - `totals` with the same aggregate shape as above
  - `counts` for `overall`, `male`, `female`, `neutral`

Missing cohorts are represented as `null` in the relevant nested metrics, not `0`.

### `report_role_result`

Reserved table for salary stats broken down per role. Role title is snapshotted because result rows must not change if the role table is later edited. This table is intentionally not part of the first report-result read response while score-bucket breakdowns are the primary requirement.

| Column                    | Type                                  |
| ------------------------- | ------------------------------------- |
| `id`                      | `uuid` PK                             |
| `report_result_id`        | `fk → report_result`                  |
| `report_employee_role_id` | `fk → report_employee_role`           |
| `role_title`              | `text` snapshot at calculation time   |
| `base_snapshot`           | `jsonb` adjusted base salary snapshot |
| `full_snapshot`           | `jsonb` adjusted full salary snapshot |

Unique constraint: `(report_result_id, report_employee_role_id)`.

### `public_report`

Insert-only snapshot published when a private report is approved. No PII, no FK to `company`. Anonymized aggregate shown on public site. Immutable by design.

| Column             | Type                                                      |
| ------------------ | --------------------------------------------------------- |
| `id`               | `uuid` PK                                                 |
| `source_report_id` | `fk → report` (internal trace only, not exposed publicly) |
| `size_bucket`      | `text` (company size bracket, e.g. `50-99`, `100+`)       |
| `isat_category`    | `text` (industry field)                                   |
| `published_at`     | `timestamp`                                               |
| `valid_until`      | `timestamp`                                               |

Full six permutations precomputed — public consumer does no math. Exact aggregate column set still TBD — minimum/maximum/median and role-level breakdown probably omitted, confirm with stakeholders.

### `report_event`

Immutable audit row emitted on state-changing actions. Insert-only. See "Audit timeline" for semantics.

| Column              | Type                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `id`                | `uuid` PK                                                                                                       |
| `report_id`         | `fk → report`                                                                                                   |
| `event_type`        | `ReportEventTypeEnum`                                                                                           |
| `actor_user_id`     | `fk → doe_user` (nullable — null for company admin, cron, or system)                                            |
| `report_status`     | `ReportStatusEnum` (snapshot at insert; `= to_status` on `STATUS_CHANGED`)                                      |
| `from_status`       | `ReportStatusEnum` (nullable — set on `STATUS_CHANGED`)                                                         |
| `to_status`         | `ReportStatusEnum` (nullable — set on `STATUS_CHANGED`)                                                         |
| `assigned_user_id`  | `fk → doe_user` (nullable — set on `ASSIGNED`)                                                                  |
| `reason`            | `text` (nullable — set on `STATUS_CHANGED` → `DENIED`; carries the denial reason)                               |
| `related_report_id` | `fk → report` (nullable — set on `SUPERSEDED`; points to the newly approved report that triggered supersession) |
| `company_id`        | `fk → company` (nullable — set on `SUBMITTED`; identifies the submitting company for audit purposes)            |

Invariants (enforce via CHECK):

- `event_type = 'STATUS_CHANGED'` ⇒ `from_status IS NOT NULL AND to_status IS NOT NULL AND report_status = to_status`.
- `event_type = 'ASSIGNED'` ⇒ `assigned_user_id IS NOT NULL`.
- `event_type = 'SUPERSEDED'` ⇒ `related_report_id IS NOT NULL`.
- `event_type = 'SUBMITTED'` ⇒ `company_id IS NOT NULL`.

### `report_comment`

Human-written message on a report. Immutable after insert (no edit). Soft-deletable by author; deleted rows hidden from the rendered thread.

| Column           | Type                                                           |
| ---------------- | -------------------------------------------------------------- |
| `id`             | `uuid` PK                                                      |
| `report_id`      | `fk → report`                                                  |
| `author_kind`    | `CommentAuthorKindEnum`                                        |
| `author_user_id` | `fk → doe_user` (nullable — set when `author_kind = REVIEWER`) |
| `visibility`     | `CommentVisibilityEnum`                                        |
| `body`           | `text`                                                         |
| `report_status`  | `ReportStatusEnum` (snapshot at insert)                        |
| `deleted_at`     | `timestamp` (nullable — soft delete by author)                 |

Invariants (enforce via CHECK):

- `author_kind = 'REVIEWER'` ⇒ `author_user_id IS NOT NULL`.
- `author_kind = 'COMPANY_ADMIN'` ⇒ `author_user_id IS NULL AND visibility = 'EXTERNAL'` (company admins cannot post internal comments).

### `config`

Generic key-value configuration table for admin-managed settings that change infrequently (e.g. once a year) but should not require a code deploy to update. New keys are added via migration/seed; admins update values via API.

Updates are **supersede-and-insert**: the old row gets `superseded_at` stamped and a new row is inserted. This preserves a full history of every value a key has held. A partial unique index (`config_active_key_idx`) ensures at most one active (non-superseded) entry per key.

| Column          | Type          | Notes                                          |
| --------------- | ------------- | ---------------------------------------------- |
| `id`            | `uuid` PK     |                                                |
| `key`           | `text`        | NOT NULL — machine-readable config key         |
| `value`         | `text`        | NOT NULL — stored as text, parsed in app layer |
| `description`   | `text`        | Nullable — human-readable explanation          |
| `superseded_at` | `timestamptz` | Nullable — null = current active entry         |

Current entries:

| key                                   | value | description                                                           |
| ------------------------------------- | ----- | --------------------------------------------------------------------- |
| `salary_difference_threshold_percent` | `3.9` | Annual gender salary difference threshold (%). Updated each February. |

No FKs, no relationships. Standalone lookup table.

## Relationships (summary)

- `company` ⟷ `report` via `company_report` (per-submission snapshot, with optional parent company).
- `report` 1:N `report_criterion` 1:N `report_sub_criterion` 1:N `report_sub_criterion_step`.
- `report` 1:N `report_employee` N:1 `report_employee_role`.
- `report_employee` 1:N `report_employee_deviation`.
- `report_employee_role` ⟷ `report_sub_criterion_step` via `report_employee_role_criterion_step`.
- `report_employee` ⟷ `report_sub_criterion_step` via `report_employee_personal_criterion_step`.
- `report` 1:1 `report_result`; optional future role snapshots are `report_result` 1:N `report_role_result` N:1 `report_employee_role`.
- `report` 1:N `public_report` (one public snapshot per approval; new approvals insert new rows).
- `report` → `report` self-ref via `equality_report_id` (salary row points to the approved equality row it was audited against).
- `report` N:1 `doe_user` via `reviewer_user_id` (DoE reviewer who accepted/denied).
- `report` 1:N `report_event`; `doe_user` 1:N `report_event` via `actor_user_id` (nullable) and `assigned_user_id` (nullable, set on `ASSIGNED`); `company` 1:N `report_event` via `company_id` (nullable, set on `SUBMITTED`).
- `report` 1:N `report_comment`; `doe_user` 1:N `report_comment` via `author_user_id` (nullable, set when `author_kind = REVIEWER`).

## Notes / open questions

- **Retraction flow deferred.** If a critical error surfaces in an already-approved public report, flow TBD. `ReportStatusEnum` is open for a future `RETRACTED` value; `public_report` columns for retraction (e.g. `retracted_at`, `retraction_reason`, `replaced_by_id`) not added yet.
- **Fines cron.** Daily job: `SELECT * FROM report WHERE fines_started_at IS NOT NULL AND status NOT IN ('APPROVED', 'SUPERSEDED')`. Accrual table (`report_fine` or similar) not yet designed.
- **Scope.** This schema targets companies with ≥50 employees. Smaller-company flows + edge cases (mergers, liquidation, exemptions) TBD.
- **Cascade vs soft-delete.** Postgres `ON DELETE CASCADE` only fires on real `DELETE` rows. Lifecycle here is status-based, not soft-delete — do not add `deleted_at` to children expecting cascade propagation.
- **Outlier-preview endpoint (planned).** `report_employee_deviation` rows are populated at submission, but the company needs to know *which* employees are outliers before they can justify them. The plan is a dedicated API endpoint (separate from `POST /reports/salary`) that takes the unsaved parsed payload, runs `assessSalaryDeviationInBucket` from `report/lib/compensation-aggregates.ts` (half the configured `salary_difference_threshold_percent` around the score-bucket median), and returns the flagged employees alongside the calculations driving the verdict so the company can verify before submitting. Endpoint shape, response payload, and home module are TBD.
- **Submit-side outlier-vs-deviation guard (planned, ships with the preview endpoint).** The submit endpoint currently trusts whatever `deviations[]` the caller sends — it only verifies each entry's `employeeOrdinal` resolves to a real employee, not that the employee is actually an outlier. A company could (intentionally or not) submit deviations for non-outliers, or omit deviations for actual outliers. The detection rule needs to live in one place across both endpoints, so the planned approach is: extract a helper `detectOutlierOrdinals(parsed, threshold) → Set<number>` from the same `assessSalaryDeviationInBucket` machinery, then call it from both the preview endpoint (returns it to the caller with calculations) and the submit pre-flight (asserts `deviations[].employeeOrdinal` matches the detected set; reject extras and/or missing per policy). Until this guard lands, the mismatch is reviewer-visible (the snapshot's score-bucket data exposes outliers) but not API-enforced.
