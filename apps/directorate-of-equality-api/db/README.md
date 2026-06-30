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
- **DoE reviewer (admin)** — reads submitted reports, denies with reason, approves when valid. Admins also flag a company into the daily-fines process (a company-level flag — see "Fines accrual"). Identified by a row in the `doe_user` table.
- **Public consumer** — browses anonymized aggregates on the public site. Has no access to PII or to denied/draft reports.

## Eligibility

Every company must submit an `EQUALITY` report — no gating column, no exceptions. `company.salary_report_required` gates only the additional `SALARY` submission. A database trigger on `company` insert/update keeps it in sync with the RSK-reported headcount:

- `average_employee_count_from_rsk >= 50` → trigger sets `salary_report_required = true`.
- `average_employee_count_from_rsk < 50` → trigger sets `salary_report_required = false`.

`salary_report_required_override` marks rows whose flag has been set manually (e.g. institutions that must report regardless of headcount, or any other case where the law-by-headcount rule doesn't apply). When `salary_report_required_override = true`, the trigger skips the row entirely — the manual value stands even as the RSK count crosses the 50-threshold in either direction.

## Industry classification (ÍSAT2008)

Companies carry an industry classification using the Icelandic ÍSAT2008 standard (Hagstofan), stored on `company.isat_category_code` as a FK into the `isat_category` reference table. This is **statistics data** — it powers industry breakdowns of approved reports — and is **not** part of the report-submission or eligibility flow.

How we handle it:

- **Leaf codes only.** `isat_category` is seeded with the 665 leaf (5-digit, two-dot) ÍSAT2008 codes. A company is always classified at its own leaf — sections, divisions, groups, and classes are not stored. The 2-digit division is recoverable from the leaf prefix (`01110` → `01`); the section letter (`A`) is not numerically derivable and is intentionally dropped.
- **Normalized code is the key.** `isat_category.code` is the normalized 5-digit form (`01110`). The dotted form (`01.11.0`) is kept alongside for display only. Company-level classification is always the normalized code.
- **Admin-owned.** `company.isat_category_code` is set and kept current by DoE admins, in the same spirit as the `salary_report_required*` flags — not supplied by company admins at submission. It is refreshed by a **manual job run once a year** against an admin-uploaded company-info file.
- **Snapshot independence.** `company.isat_category_code` and `company_report.isat_category` are unrelated. The latter is a free-text dotted code frozen at submission (a snapshot is just a snapshot); the former is the live admin-maintained classification. The submission flow never reads from or writes to the company-level value, and `company_report` is never updated when the company's classification changes.

> **Subject to change.** This is an interim design while the feature is in development. The long-term intent is to source classification directly from the RSK API once we have access; until then, the annual admin-uploaded file is the source of truth. The stored format (normalized leaf code) and admin ownership may change when that integration lands.

## Company import (annual register)

Company records are refreshed from an authoritative `.xlsx` register an admin uploads once a year (columns: kennitala, name, address, postcode, ÍSAT, size bucket). The file is the **source of truth**; the import reconciles `company` against it, matched on `national_id`. Endpoints run **preview → confirm**: `POST /companies/import/preview` returns the diff and writes nothing; `POST /companies/import/apply` commits in one transaction. Both return the same categorized summary so the admin UI can show exactly what happened.

**Upload transport.** The `.xlsx` is **not** posted to the API. The admin first calls `POST /imports/presign` to get a short-lived presigned S3 PUT URL plus an object `key`, uploads the file straight to S3 from the browser, and then passes that `key` (not the bytes) to `preview`/`apply` — both take a JSON `{ key }` body. The API fetches the object from S3, parses it in-memory, and deletes the staged object after `apply` (preview leaves it so the same upload can be applied without re-uploading). Keys are namespaced and validated per guard boundary (`doe-imports/admin/<uuid>.xlsx`); the size cap (20 MB) is enforced after fetch. This keeps large workbooks off the API/Next request path entirely and is shared with the salary-report imports (see [Excel import transport](#excel-import-transport)).

Per company:

- **In file, not in DB** → created (status `ACTIVE`).
- **In file + DB, fields differ** → the differing authoritative fields (`name`, `address`, `postcodeId`, `isat_category_code`, `employee_count_category`) are updated.
- **In file + DB, identical** → unchanged.
- **In DB, absent from file** → **deactivated** (status set to `INACTIVE`). The file is the source of truth: a company that drops out of the register is no longer active. Already-`INACTIVE` companies are left as-is (nothing to change).
- **Reappears in file** after `INACTIVE` → reactivated to `ACTIVE`.
- **Invalid rows** (bad kennitala, unknown ÍSAT code, duplicate kennitala in file) → reported, never applied.

Size comes from the `LAUNAFLOKKUR` column (`50+`→`LARGE`, `25-49`→`MEDIUM`, else→`SMALL`); `salary_report_required` is then derived by the usual DB trigger. ÍSAT codes are normalized to 5 digits and validated against `isat_category`. A postcode that doesn't resolve is a soft note, not a rejection.

Only the status transitions the import performs (`ACTIVE→INACTIVE`, `INACTIVE→ACTIVE`) emit `company_event` rows; field edits are audited via the import summary and a structured log line, not per-company events. (A first-class import-audit table — `system_event` — is a possible future addition.)

> **Subject to change.** Interim design; in development. Same RSK-API caveat as above — the annual upload is expected to be replaced by a direct RSK feed eventually.

## Excel import transport

Every `.xlsx` import in DoE — the company register import and the salary-report imports — uses the **same presigned-S3 upload mechanism** instead of multipart POSTs through the API. The bytes never traverse the API (or the Next.js tRPC server); only an S3 object **key** does.

Flow, for every importer:

1. **Presign** — the client calls the boundary's presign endpoint, which returns `{ url, key }`. `url` is a presigned S3 PUT (1-hour expiry); `key` is `doe-imports/<boundary>/<uuid>.xlsx`.
2. **Upload** — the client PUTs the file directly to `url`.
3. **Import** — the client calls the import endpoint with a JSON `{ key }` body. The API validates the key against the caller's own boundary prefix, fetches the object from S3, enforces the 20 MB cap, and parses it in-memory.
4. **Cleanup** — single-shot imports (and `apply`) delete the staged object after parsing; company-import `preview` keeps it so the same upload can be applied without re-uploading. A bucket lifecycle rule is the backstop for anything left behind.

Two **guard boundaries**, two presign endpoints, keys namespaced so a request can only read objects staged for its own audience:

- **`admin`** (`AdminGuard`) — `POST /imports/presign` feeds the admin importers: `POST /admin-report/companies/:companyId/reports/excel/import`, `POST /companies/import/preview`, `POST /companies/import/apply`, and `POST /reports/excel/import`.
- **`application`** (`CompanyResourceGuard`) — `POST /application/reports/excel/presign` feeds the company-admin importer `POST /application/reports/excel/import`.

The presign + fetch + cleanup logic lives in one shared `ImportUploadService`; each controller only binds it to its guard. The bucket is resolved by `getDoeImportsBucket()` (env `AWS_SALARY_ANALYSIS_FILES_BUCKET`).

> **Infra prerequisites.** The bucket needs (a) CORS allowing `PUT` from the web origins, or the browser upload fails, and (b) a lifecycle rule to expire `doe-imports/` objects. `AWS_SALARY_ANALYSIS_FILES_BUCKET` must be set per environment (the resolver throws if it's missing).

## Report lifecycle

`report.status` drives every transition. Resubmissions are new rows; there is no FK chain back to the prior submission.

```
  DRAFT  ──submit──▶  SUBMITTED  ──pickup──▶  IN_REVIEW
                          ▲                       │
                          │ resolve outliers      │
                          │ (PUT /outliers)       │
                          │                       │
                       POSTPONED       ┌──────────┤
                       (no pickup)     ▼          ▼
                                    DENIED     APPROVED
                                       │          │
                                       │ (denial  │ (3yr later, or on new approval)
                                       │  is      ▼
                                       │  final)  SUPERSEDED
                                       │
                                  (new application = new provider_id = new row)
```

State-by-state:

- **`DRAFT`** — company admin is still editing. Not visible to reviewers. Most columns may be null. Can transition to `SUBMITTED`.
- **`SUBMITTED`** — company finalized the submission. `created_at` is the submission timestamp for the row. Waits in reviewer queue.
- **`POSTPONED`** — applies to `SALARY` reports only. The company submitted with all outliers deferred (`outliers[]` rows persisted with null explanation columns). The report is **not pickable** by reviewers — `assign()` rejects this status, `approve()` rejects this status. The applicant resolves the postponement via `PUT /api/v1/application/reports/:providerId/outliers`, which fills in the explanation fields and transitions the row to `SUBMITTED` (emitting a `STATUS_CHANGED` + an `EDITED` event). Reviewers can read the report and its content while it sits here, but cannot act on it.
- **`IN_REVIEW`** — a reviewer has picked up the report. (If you want reviewer-assignment tracking, stamp `reviewer_user_id` on pickup; currently it's stamped on the final decision.) In-place applicant edits are allowed in this state via the two PUT endpoints (equality body / outliers), each emitting an `EDITED` event; status is preserved so the reviewer keeps their pickup.
- **`DENIED`** — reviewer rejected the submission. `reviewer_user_id` set on the report. Denial reason is stored on the `STATUS_CHANGED` event (`reason` column) rather than the report row — keeps the audit trail self-contained. **Terminal state.** This denied row stays as audit forever and is never mutated. The company submits afresh via the upstream application portal, which produces a new `provider_id` and a new `report` row.
- **`APPROVED`** — reviewer accepted. `approved_at` set, `valid_until = approved_at + 3 years`. The parent company's matching next-due column is advanced to the same `valid_until` (`next_salary_report_due_at` for a `SALARY` approval, `next_equality_report_due_at` for `EQUALITY`), keeping it the live source of truth for the renewal-window check. A `public_report` row is inserted as part of this transition. `approve()` additionally gates on every outlier row having all four explanation fields filled — a belt-and-suspenders check on top of the `POSTPONED → SUBMITTED` resolution flow.
- **`SUPERSEDED`** — a newer report **of the same `type`** from the same company has been approved. Old `valid_until` gets stamped to `now()`. This does **not** touch the company's `next_*_report_due_at` — that was already advanced to the new report's `valid_until` by the approval above; the superseded row is no longer the company's current obligation. Only one `APPROVED` report per `(company, type)` pair is "current" at any time — an approved `SALARY` does **not** supersede an approved `EQUALITY` and vice versa, since every company needs both kinds active simultaneously (equality universally, salary for ≥50-employee companies).
- **`WITHDRAWN`** — a report retired before any reviewer acted on it. **Terminal state.** Reached two ways, both before the report became live work:
  - **Auto-withdrawn on sibling resubmission.** When a company submits a new report of a given `type`, `report-create.service.ts` silently withdraws any still-`SUBMITTED` predecessor of the same type for that company (`withdrawOrRejectInflightSibling()`): the old row flips to `WITHDRAWN` and a `WITHDRAWN` `report_event` is emitted on it with `related_report_id` pointing at the new replacing report (mirroring `SUPERSEDED`). A prior report in `IN_REVIEW` or `POSTPONED` is **not** auto-withdrawn — those flows are active, so the new submission is rejected with 409 instead.
  - **Applicant-withdrawn.** `application.withdraw()` (`POST` on the application surface) sets a report to `WITHDRAWN` when the applicant deleted the originating island.is application upstream, emitting a `STATUS_CHANGED` event. Allowed only before a terminal state (`APPROVED`/`DENIED`/`SUPERSEDED`); idempotent on an already-`WITHDRAWN` report.

## Outlier deadlines

> **Status:** this section describes the intended domain model. It is **subject to change** and largely **not yet implemented** — see "Implementation status" at the end. The single `report.correction_deadline` column exists today but is never written, and the email / fine actions below do not exist yet.

A **`SALARY` report that contains outliers** can carry up to **two** distinct deadline dates. Both are measured from the **report submission date** (`created_at` on the row when it reaches `SUBMITTED`). A salary report with **no** detected outliers needs neither — there is nothing to correct or explain. `EQUALITY` reports are not subject to either deadline.

The column is currently named `correction_deadline`, which is a poor fit because two different concepts are in play. Treat the name as provisional.

### 1. Outlier correction deadline (the "fix the gap" clock)

Every salary report **with outliers** gets a deadline to actually *correct* the pay gap. This is a fixed policy, not a per-report or reviewer-set value:

- **Default 9 months** from submission. Today this is uniform — every applicable report gets exactly 9 months, with no expectation that the duration will vary per report.
- The intended action: ~9 months after submission the submitter receives an email asking whether they have fixed their outliers, and answers **yes/no**. (This email/follow-up action does not exist yet.)

### 2. Postponement deadline (the "submit your explanations" clock)

Only applies when a submitter **opts in to postpone** their outlier explanations at submit time (`outliersPostponed = true`, landing the report in `POSTPONED` status — see "Report lifecycle"):

- The submitter then has **3 months** from submission to provide the explanations (via `PUT /api/v1/application/reports/:providerId/outliers`, which resolves `POSTPONED → SUBMITTED`).
- If they do not submit within those 3 months, an admin may flag the company into the **daily-fines process** (a company-level flag — see "Fines accrual").
- This 3-month window **does not extend** the 9-month correction deadline. It lives **inside** the 9-month period — the gap-correction clock keeps running regardless of when (or whether) the explanations are submitted.

### Implementation status

- **Today:** only the single nullable `report.correction_deadline` column exists. Nothing writes to it; it is always `null` in practice. Postponement is modeled purely as the `POSTPONED` status with NULL outlier explanation columns — no postponement deadline is persisted.
- **Not yet built:** automatic computation of either deadline at submission and the 9-month follow-up email (yes/no). The daily-fines step is now a manual, company-level admin flag rather than an automatic per-report transition — there is no accrual table or cron (see "Fines accrual").
- **Likely future shape:** the two concepts probably want two separate columns (e.g. an outlier-correction deadline and a postponement deadline) rather than the single overloaded `correction_deadline`. Not decided.

## Resubmission

A resubmission is always a **new row** in `report`. It is never an update of an existing report. There is no FK linking the new row back to the one it replaces — old and new are correlated via `company_report.company_id` + `report.created_at` ordering, not a direct reference. Children (`report_criterion`, `report_employee`, `report_result`, etc.) belong to the new row — old children stay with the old row.

Two resubmission triggers:

1. **Denial** — reviewer denied the current submission. The denied row stays as audit forever and is never mutated. A redo always comes through as a fresh upstream application — new `provider_id` → new `report` row → fresh review queue entry. A future PUT-edit endpoint is planned to allow targeted in-place edits to a denied row after admin/applicant communication, but that is distinct from resubmission; resubmission is always a new row.
2. **Three-year expiry** — approved report is aging out. Companies are notified ~3 months before `valid_until`. A new report is drafted and submitted. On approval, the old report transitions to `SUPERSEDED`.

### Salary renewal window (the "not too early" gate)

Salary reports run on a 3-year cadence, but a company may only submit a **new** salary report once its current one is **due in 6 months or less** — it cannot renew arbitrarily early. The window is measured against `company.next_salary_report_due_at`:

- `next_salary_report_due_at IS NULL` (no obligation on record / first-timer) → **allowed**.
- due date already in the past (overdue) → **allowed**.
- due date strictly more than 6 months in the future → **blocked**.

The rule is enforced two ways, both reading the same logic so they cannot drift:

- **Pre-flight:** `GET /api/v1/application/reports/salary/eligibility` returns `{ eligible, reason, dueAt, earliestSubmissionDate }`. The application portal calls it to decide whether to let a company into the salary flow at all; `reason = RENEWAL_WINDOW_NOT_OPEN` when blocked.
- **At submit:** `POST /api/v1/application/reports/salary` throws **409 Conflict** when the window isn't open. Only the company-facing portal path is gated — admin/system-created reports are not.

The 6-month window is a hardcoded constant (`SALARY_RENEWAL_WINDOW_MONTHS`), matching the hardcoded 3-year validity rule.

## Provider correlation

Every report row records who submitted it on the upstream side via the pair `(provider_type, provider_id)`:

- **`provider_type`** (`ReportProviderEnum`) — the upstream system that originated the submission. `ISLAND_IS` for reports forwarded from the island.is application portal, `SYSTEM` for DoE-internal/manual creations, `OTHER` as an escape hatch for any future integration that isn't island.is.
- **`provider_id`** — the upstream system's own ID for this specific submission. For an island.is-originated report this is the application's UUID on their side. Separate from `report.identifier`, which is the DoE-side internal handle and has no relation to the upstream ID.

Each new island.is submission gets its own `provider_id` — the type identifies the channel, the id identifies the individual application on that channel. Once a row exists for a given `(provider_type, provider_id)` tuple, that mapping is permanent: the row is never duplicated, and a future resubmission from the same company comes through as a fresh upstream application with a new `provider_id`. SYSTEM-created rows leave both columns null.

**Uniqueness.** A partial unique index on `(provider_type, provider_id) WHERE provider_id IS NOT NULL` enforces one-row-per-tuple at the DB level. The application layer in `report-create.service.ts` also short-circuits on replay: if a non-null `(provider_type, provider_id)` already exists *and the submitting company matches the existing row's parent*, the create returns the existing `reportId` instead of inserting. That makes upstream network retries transparent — same payload + same key = same response. Cross-company collisions on the same tuple (an unlikely but theoretically possible "a new provider channel emits an id that an existing channel already used" scenario) are rejected with a 409.

## Audit timeline (events + comments)

Two parallel streams capture what happens to a report after draft. The admin UI renders them as a unified, per-status-bucket timeline.

- **`report_event`** — immutable, system-generated audit rows. Emitted on state-changing actions: submission, reviewer assignment / unassignment, status transitions, applicant in-place edits (`EDITED`), supersession, withdrawal (`WITHDRAWN` on auto-withdrawal; `STATUS_CHANGED` on applicant withdrawal), and the system auto-review verdict (`SYSTEM_AUTO_REVIEW`; audit-only, see "System auto-review"). Daily fines are tracked on the **company**, not the report, so they emit a `company_event` (`FINES_STARTED` / `FINES_STOPPED`) rather than a `report_event`. Never edited, never deleted.
- **`report_comment`** — human-written messages. Either **internal** (reviewer-to-reviewer, hidden from the company) or **external** (reviewer ↔ company admin, visible to both sides). Company admins can post on external comments only.

### Mutability

- Events are insert-only. No edits, no deletes.
- Comments are **immutable after insert** (no edit flow). Authors may soft-delete their own comment (`deleted_at` stamped); deleted rows are hidden entirely from the rendered thread — no tombstone. Reviewers delete only their own comments; company admins ditto. System events cannot be deleted regardless of actor.

### Author model

- `report_event.actor_user_id` — fk → `doe_user` (nullable). Null means company admin (e.g. `SUBMITTED`) or cron/system.
- `report_comment.author_kind` — `REVIEWER` or `COMPANY`:
  - `REVIEWER` → `author_user_id` points to the reviewer's `doe_user` row.
  - `COMPANY` → `author_user_id` is null; display identity is hydrated from the parent `report.company_admin_*` cached fields. Company admins are intentionally not captured in `doe_user` (see Tables → `doe_user`).

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

### System auto-review (soft verdict)

On submission a freshly created report is run through the `report-auto-review` module (`ReportAutoReviewService`), which reaches a soft verdict and records it as a `SYSTEM_AUTO_REVIEW` `report_event`. The verdict lives on the event's `system_decision` column (`AutoReviewDecisionEnum`: `AUTO_APPROVE` | `NEEDS_REVIEW`); the human-readable reasoning is stored in the event's `reason` text.

This is **audit-only**: during the soft phase the verdict **never changes the report's status** — the report still waits in the reviewer queue regardless. `system_decision` is a first-class column rather than an overloaded status so "how often would we have auto-approved?" is a direct query. `EQUALITY` reports are narrative and abstain.

## Public snapshot flow

On the `APPROVED` transition, the system inserts a row into `public_report`. This row is:

- **Anonymized** — no company name, no national ID, no personal data. Only `size_bucket`, `isat_category`, and precomputed salary aggregates.
- **Detached** — `source_report_id` exists for internal traceability but is never exposed on the public API.
- **Immutable** — insert-only, no `updated_at`, no `deleted_at`. Once published, it stays as-is.
- **Precomputed** — all six directional `salary_difference_*` permutations are written. The public site does zero math; it just renders.

If a mistake is discovered post-publication, the retraction flow (TBD) kicks in. Until that's designed, assume public rows are permanent.

## Fines accrual

When a company misses its deadline it may be placed into the **daily-fines process**. That process — issuing and tracking the actual fines — is handled **outside this system** (the matter is escalated and dealt with elsewhere). This database only records **that** a company is in the process, not the individual fines.

- Modeled as a single boolean flag, `company.fines_started`, defaulting to `false`.
- An admin toggles it **both ways** (`PATCH /api/v1/companies/:id/fines`). `true` tells admins "this company is being handled in the fines process — don't act on it through the normal flow"; `false` clears it once the matter is resolved.
- The "when" + an optional reason are captured on the emitted `company_event` (`FINES_STARTED` / `FINES_STOPPED`) so the company timeline carries the full audit. The flag itself stores no timestamp.
- The list endpoint exposes a `finesStarted` filter so admins can see exactly which companies are in the process.

No accrual table and no cron: the fines themselves live outside this system, so the earlier per-report `report.fines_started_at` timestamp, the `report_fines_cron_idx` index, and the planned `report_fine` accrual table were all removed.

### Overdue reports (the prompt to act)

So admins know **when** to consider starting the fines process, the company list surfaces overdue obligations. `company.next_equality_report_due_at` / `next_salary_report_due_at` hold each company's next due dates — seeded for the launch cohort, then advanced by the approval flow (`approve()` sets them to the new report's `valid_until`); nullable when there's no obligation. Two derived booleans, `equalityReportOverdue` / `salaryReportOverdue` (computed in SQL on read, not stored), are `true` when the matching due date is in the past. They drive an overdue indicator in the UI plus an `overdue` list filter and a `nextReportDue` sort, so an admin can spot a lapsed company and decide whether to flag it into the fines process.

## Quarantine

`company.quarantined` is an **admin-only halt switch**. While a company is quarantined, the system performs **no outbound activity** for it: scheduled jobs (eventual crons), emails / notifications, and any other automated touchpoint must skip a quarantined company. It is a hard "leave this company alone" signal, distinct from `fines_started` (which says the company is being handled elsewhere) and from `status` (its lifecycle state) — a company can be any status and still be quarantined.

- **Purely manual.** There is no computed signal that decides quarantine. An admin sets it for a specific, agreed-upon case — typically after direct discussion with the company.
- **Boolean flag**, `quarantined`, defaulting to `false`. An admin toggles it **both ways** (`PATCH /api/v1/companies/:id/quarantine`); `true` halts, `false` lifts.
- The "when" + an optional reason are captured on the emitted `company_event` (`QUARANTINED` / `UNQUARANTINED`) so the company timeline carries the full audit. The flag itself stores no timestamp.
- The list endpoint exposes a `quarantined` filter.

**Enforcement is the caller's responsibility.** This database/flag only records the decision; every outbound code path (mail service, future scheduled jobs, notification hooks) must check `company.quarantined` and skip quarantined companies. Those gates are added per touchpoint as they are built — there are no automated outbound jobs gated on it yet.

## Application-facing reads and writes

The `application` module is the company-admin API surface. It reuses reviewer-side domain services where possible, but applies company-specific ownership and visibility rules at the boundary:

- `GET /api/v1/application/company` resolves the JWT national ID to a live `company` row.
- `GET /api/v1/application/reports/equality/active` returns the company's active equality report: `type = EQUALITY`, `status = APPROVED`, `valid_until > now()`, joined through `company_report.company_id`. If multiple active rows exist, the service orders by `approved_at DESC` and returns the most recently approved row.
- `GET /api/v1/application/reports/salary/eligibility` returns whether the company may submit a salary report right now (the renewal-window check — see "Salary renewal window"). Always 200; `eligible = false` with `reason = RENEWAL_WINDOW_NOT_OPEN` when the due date is more than 6 months out.
- `POST /api/v1/application/reports/equality` and `POST /api/v1/application/reports/salary` accept application-facing bodies with one explicit `company` object for the authenticated parent and an optional `subsidiaries[]` array containing subsidiary names/national IDs. Missing or empty `subsidiaries` means no subsidiaries. The application service maps that to the internal `companies[]` snapshot shape before delegating to report-create.
- `GET /api/v1/application/reports/:providerId` is company-facing detail, not the reviewer detail DTO. Lookup is by the upstream `(provider_type, provider_id)` tuple rather than internal `report.id` (the applicant never sees the DoE-side id). The optional `providerType` query parameter defaults to `ISLAND_IS` for the island.is application portal. The resolved company must own the parent `company_report` row (`parent_company_id IS NULL`). The response includes all participating company snapshots, external comments only, salary result/outlier data for salary reports, the linked equality summary for salary reports, equality narrative content for equality reports, and the latest denial reason when the report is `DENIED`. It does not expose the reviewer event timeline or internal comments.
- `POST /api/v1/application/reports/:providerId/comments` posts an external comment on the applicant's own report.

### Applicant edit endpoints

In-place edits are exposed for the two narrow corrections the applicant flow needs after submission. Both are authenticated against the upstream `(provider_type, provider_id)` tuple (same ownership check as the GET, with `providerType` defaulting to `ISLAND_IS`) and emit an `EDITED` `report_event` row on success.

- `PUT /api/v1/application/reports/:providerId/equality-content` — replaces the narrative body of an `EQUALITY` report. Allowed only when `status = IN_REVIEW` (i.e. the reviewer has picked the report up and asked for changes via comment). Status is preserved on success.
- `PUT /api/v1/application/reports/:providerId/outliers` — replaces outlier explanations on a `SALARY` report. All-or-none: the submitted set must match the canonical detected outliers exactly (read from `report_result.outlier_analysis_snapshot.employees` filtered to `isOutlier = true`); duplicates, extras, or missing rows all reject 400. Allowed in two statuses:
  - `POSTPONED` — primary path. The submitted body must include all four explanation fields per row (`reason`, `action`, `signatureName`, `signatureRole`). On success the row's explanation columns are filled and status transitions `POSTPONED → SUBMITTED`, emitting both an `EDITED` and a `STATUS_CHANGED` event.
  - `IN_REVIEW` — correction path. Reviewer asked for outlier-row corrections via comment; the applicant edits without changing status. Only `EDITED` is emitted.

A future endpoint may handle other in-place edits after admin/applicant communication; everything else still requires a fresh upstream submission.

## Daughter companies

Large companies often report on behalf of their corporate group. The `company_report` table captures this — one row per participating company per submission, with the submitted company identity and details (name, national ID, address, headcount, ISAT category) snapshotted so later third-party changes don't rewrite history:

- One row per (company, report) pair.
- `parent_company_id` (nullable) points to the parent company in the group. A row with `parent_company_id = NULL` is the top-level reporter; rows with it set are subsidiaries.
- All employees of all companies in the group are listed on the same `report`. Reviewers see the full company list by reading `company_report` for that report.

Application-side submit receives the parent as `company` and subsidiaries as `subsidiaries[]`. The parent national ID must match the JWT-resolved company; subsidiary national IDs must be unique and cannot be the parent. Subsidiary snapshot details are resolved through the company module, which currently has a placeholder implementation until the external company API is wired in. `average_employee_count_from_rsk` is not accepted in submit payloads; report creation snapshots it from the live `company` row, where it is admin-controlled.

The schema does **not** track which specific company paid which specific employee. Aggregate visibility (the list of participating companies) is sufficient for the audit.

## Criteria scoring (how a report is evaluated)

Each report is evaluated against a set of weighted criteria:

- `report_criterion` — top-level buckets (e.g. "equal pay for equal work"). Each has a `weight` and a `type` (`STATIC`, `CONDITION`, `CONTINUOUS`, `PERSONAL`).
- `report_sub_criterion` — sub-buckets within a criterion, also weighted.
- `report_sub_criterion_step` — ordered scoring steps within a sub-criterion. Each step has a `score`.
- Which steps apply to which role is captured in `report_employee_role_criterion_step`.
- Which steps apply to a specific employee personally is captured in `report_employee_personal_criterion_step`.
- Salary outlier justifications (special circumstances) are grouped in `report_outlier_group` — each group owns the shared `reason`, `action`, and signature fields — with `report_employee_outlier` joining each detected outlier employee to its group.

The final `score` on `report_employee` is derived from the steps that apply to that employee — the sum of `report_sub_criterion_step.score` across the steps reachable via the employee's role (`report_employee_role_criterion_step`) and via their personal assignments (`report_employee_personal_criterion_step`), with steps assigned through both sources counted once. The total is computed at submission and persisted on the row; reviewers read it as-is.

## Results aggregation

`report_result` holds immutable report-level salary snapshots for both **adjusted base salary** (`baseSalary / workRatio`) and **adjusted full salary** (`(baseSalary + additionalSalary + bonusSalary) / workRatio`, where `additionalSalary` / `bonusSalary` are the derived sums of their sub-component columns — see `report_employee`). The snapshots are stored as JSONB because the service reads results by `report_id` rather than querying individual metrics in SQL. Each salary family stores report-level totals and score-bucket breakdowns. The same row also snapshots the salary-outlier regression analysis: the fitted base-salary regression lines (gender-blind `regressions.overall`, plus per-cohort `regressions.male/female/neutral` for visualisation), the configured threshold, and each employee's adjusted base salary vs predicted base salary at their exact score. `report_role_result` is kept as the reserved home for a future role-level breakdown and snapshots the role title used at calculation time. Both tables are write-once at submission — computed in the same transaction that persists the report, so reviewers can read the aggregates as soon as they pick the report up. They are not edited by humans, and the approval transition does not recompute them. (Contrast with `public_report`, which is published only on the `APPROVED` transition.)

### Gender bundling: NEUTRAL counts as FEMALE (M vs F+N)

The current product goal is to measure the pay gap between men and women, expressed as **MALE vs FEMALE+NEUTRAL**. So for every aggregation, count, gender-split regression and chart series, `NEUTRAL` employees are **bundled into the `FEMALE` group**. Concretely:

- `totals.female` / bucket `female` averages, medians and counts **include** neutral employees; `maleFemale` is therefore the gap of male vs (female + neutral).
- The standalone `neutral` cohort (metrics, counts, `regressions.neutral`) is consequently **always empty** in computed output — `null` metrics, `0` counts.
- The gender-blind `regressions.overall` and the outlier flag are unaffected: they already include every employee regardless of gender, and neutral employees are still flagged like anyone else.
- On the chart (admin web + PDF) neutral scatter points render in the purple "Kona" (female) series.

This is a **reclassification at computation/display time only** — raw `report_employee.gender` keeps the real `NEUTRAL` value, so the data is preserved for a future standalone neutral category. The rule is centralised in `bundleNeutralIntoFemale()` (`report/lib/compensation-aggregates.ts`) so it is easy to reverse. Decision date: 2026-06.

### Reconstructing the gender-vs-score chart from a stored result

The same chart shape that `buildChartFromEmployeePoints` produces for the application-side preview can be rebuilt from a persisted `report_result` row:

- **Scatter points** — `outlier_analysis_snapshot.employees[*]` carries `score`, `gender`, and `adjustedBaseSalary` per employee.
- **Regression line(s)** — `outlier_analysis_snapshot.regressions.overall` is the gender-blind line that drives the outlier flag. `regressions.male/female` are per-cohort lines available for visualisation only; `female` includes neutral and `regressions.neutral` is empty (see "Gender bundling" above).
- **Score-bucket overlay** — the per-employee `scoreBucketRangeFrom/To` is preserved on each row, but the bucket-level aggregates (median, average, gender breakdowns, counts) live in `base_snapshot.scoreBuckets`. Render the chart by joining on the bucket range when an overlay is needed.
- **Tolerance band** — the chart shades a wedge of `predicted × (1 ± allowedDifferencePercent / 100)` around the regression line; a point outside it is an outlier. The live base-salary chart endpoint returns `allowedDifferencePercent` directly on `SalaryByGenderAndScoreDto`; from a stored result it is `outlier_analysis_snapshot.allowedDifferencePercent` (half the threshold). Outlier dots are highlighted on the chart (computed from the same rule), so the scatter matches the outlier table.

Bucket placement is informational only: the outlier flag is decided against the regression prediction at the employee's exact score, not the bucket median.

## Enums

| Enum                      | Values                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `GenderEnum`              | `MALE`, `FEMALE`, `NEUTRAL`                                                                      |
| `ReportProviderEnum`      | `SYSTEM`, `ISLAND_IS`, `OTHER`                                                                   |
| `ReportCriterionTypeEnum` | `RESPONSIBILITY`, `STRAIN`, `CONDITION`, `COMPETENCE`, `PERSONAL`                                |
| `EducationEnum`           | `COMPULSORY`, `UPPER_SECONDARY`, `VOCATIONAL`, `BACHELOR`, `MASTER`, `DOCTORATE`, `PROFESSIONAL` |
| `ReportStatusEnum`        | `DRAFT`, `SUBMITTED`, `POSTPONED`, `IN_REVIEW`, `DENIED`, `APPROVED`, `SUPERSEDED`, `WITHDRAWN`   |
| `ReportTypeEnum`          | `SALARY`, `EQUALITY`                                                                             |
| `ReportEventTypeEnum`     | `SUBMITTED`, `ASSIGNED`, `UNASSIGNED`, `STATUS_CHANGED`, `SUPERSEDED`, `EDITED`, `WITHDRAWN`, `SYSTEM_AUTO_REVIEW` |
| `AutoReviewDecisionEnum`  | `AUTO_APPROVE`, `NEEDS_REVIEW`                                                                   |
| `CompanyStatusEnum`       | `ACTIVE`, `INACTIVE`                                                                             |
| `CompanySizeEnum`         | `UNKNOWN`, `SMALL`, `MEDIUM`, `LARGE`                                                            |
| `CompanyEventTypeEnum`    | `CREATED`, `STATUS_CHANGED`, `FINES_STARTED`, `FINES_STOPPED`, `QUARANTINED`, `UNQUARANTINED`, `EQUALITY_REPORT_DEADLINE_REMINDER_SENT`, `SALARY_REPORT_DEADLINE_REMINDER_SENT`, `EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL`, `SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL` |
| `CompanyReminderTierEnum` | `SIX_MONTHS`, `TWO_MONTHS`, `TWO_WEEKS`, `DUE`                                                   |
| `CommentVisibilityEnum`   | `INTERNAL`, `EXTERNAL`                                                                           |
| `CommentAuthorKindEnum`   | `REVIEWER`, `COMPANY`                                                                            |

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

| Column                            | Type                                                |
| --------------------------------- | --------------------------------------------------- |
| `id`                              | `uuid` PK                                           |
| `name`                            | `text`                                              |
| `employee_count_category`         | `company_size_enum` (`UNKNOWN`/`SMALL`/`MEDIUM`/`LARGE`) |
| `national_id`                     | `text` (unique)                                     |
| `status`                          | `company_status_enum` (`ACTIVE`/`INACTIVE`)         |
| `email`                           | `text` (nullable — admin-set contact email; read by the report-deadline-reminder task) |
| `address`                         | `text` (nullable)                                   |
| `postcode_id`                     | `fk → postcode` (nullable)                          |
| `salary_report_required`          | `boolean`                                           |
| `salary_report_required_override` | `boolean`                                           |
| `fines_started`                   | `boolean` (default `false`)                         |
| `quarantined`                     | `boolean` (default `false`)                         |
| `next_equality_report_due_at`     | `timestamptz` (nullable — seeded, then advanced to `valid_until` on each EQUALITY approval) |
| `next_salary_report_due_at`       | `timestamptz` (nullable — seeded, then advanced to `valid_until` on each SALARY approval; gates the salary renewal window) |
| `isat_category_code`              | `text` `fk → isat_category(code)` (nullable)        |

`status` is `ACTIVE` while a company is in the authoritative register and `INACTIVE`
once it is not. It is set to `INACTIVE` either deliberately by an admin (bankruptcy,
merger) or automatically by the company import when a company we hold is absent from
the latest register, and flips back to `ACTIVE` if it reappears
(see [Company import](#company-import-annual-register)).

`fines_started` flags a company as being in the daily-fines process, which is handled
outside this system (see [Fines accrual](#fines-accrual)). `quarantined` is an admin
halt switch (see [Quarantine](#quarantine)). `next_*_report_due_at` are the company's
next due dates; admins act on them via the derived `equalityReportOverdue` /
`salaryReportOverdue` read-only flags.

### `company_event`

Immutable, append-only timeline of company-lifecycle events. Mirrors `report_event` but scoped to the company. Insert-only (`created_at` only). Carries `CREATED` (registration), `STATUS_CHANGED` (`ACTIVE`/`INACTIVE` move, with `from_status`/`to_status`), the fines/quarantine toggles (`FINES_STARTED`/`FINES_STOPPED`/`QUARANTINED`/`UNQUARANTINED`, each with an optional `reason` and no status move), and the four deadline-reminder outcomes emitted by the report-deadline-reminder task. For reminder events, `reason` holds the ISO due date being reminded about and `reminder_tier` records which milestone fired — together they form the idempotency key (one row per company per report-kind per tier per due date).

| Column           | Type                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `id`             | `uuid` PK                                                                                  |
| `company_id`     | `fk → company`                                                                             |
| `event_type`     | `CompanyEventTypeEnum`                                                                      |
| `actor_user_id`  | `fk → doe_user` (nullable — null for cron/system; set for admin actions)                   |
| `status`         | `company_status_enum` (snapshot of the company status at insert)                           |
| `from_status`    | `company_status_enum` (nullable — set on `STATUS_CHANGED`)                                 |
| `to_status`      | `company_status_enum` (nullable — set on `STATUS_CHANGED`)                                 |
| `reason`         | `text` (nullable — optional reason; for reminder events holds the ISO due date)            |
| `reminder_tier`  | `company_reminder_tier_enum` (`CompanyReminderTierEnum`; nullable — set only on deadline-reminder events) |

Invariant (enforced via CHECK):

- `event_type = 'STATUS_CHANGED'` ⇒ `from_status IS NOT NULL AND to_status IS NOT NULL AND status = to_status`.

### `company_comment`

Internal, admin-authored note attached to a company. Unlike `report_comment` there is **no** visibility/author-kind dimension — company comments are reviewer-internal only (companies never see them); the author is always an admin `doe_user`. Soft-deletable so the timeline stays auditable; deleted rows are hidden from the rendered thread.

| Column           | Type                                                |
| ---------------- | --------------------------------------------------- |
| `id`             | `uuid` PK                                           |
| `company_id`     | `fk → company`                                      |
| `author_user_id` | `fk → doe_user` (nullable)                          |
| `body`           | `text`                                              |
| `deleted_at`     | `timestamp` (nullable — soft delete by author)      |

### `isat_category`

Reference table of ÍSAT2008 industry classifications, seeded from `ISAT_2008.json` (665 leaf codes — see [Industry classification](#industry-classification-ísat2008)). Read-only at runtime; refreshed only when the standard changes. `company.isat_category_code` FKs into `code`.

| Column           | Type                                |
| ---------------- | ----------------------------------- |
| `code`           | `text` PK (normalized, e.g. `01110`) |
| `code_dotted`    | `text` (display form, e.g. `01.11.0`) |
| `description`    | `text` (Icelandic)                  |
| `description_en` | `text` (English)                    |

### `company_report`

Submission-time snapshot of a company participating in a report. `company_id` points to the current (mutable) row in `company`; all submitted identity and detail fields are frozen at submission so audits reflect the company data supplied then, not later third-party values. `parent_company_id` allows a parent company to be linked alongside a subsidiary. The `salary_report_required*` flags are admin/gating state, not historical data, and are intentionally not snapshotted — read them off `company`.

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
| `company_national_id`            | `text` (nullable; cached submitter/company national ID when supplied)                                                          |
| `contact_email`                  | `text`                                                                                                                         |
| `contact_phone`                  | `text`                                                                                                                         |
| `average_employee_male_count`    | `decimal(10, 2)`                                                                                                               |
| `average_employee_female_count`  | `decimal(10, 2)`                                                                                                               |
| `average_employee_neutral_count` | `decimal(10, 2)`                                                                                                               |
| `provider_type`                  | `ReportProviderEnum` (upstream channel — see "Provider correlation")                                                           |
| `provider_id`                    | `text` (nullable; upstream submission ID — see "Provider correlation". Unique with `provider_type` when not null.)              |
| `imported_from_excel`            | `boolean`                                                                                                                      |
| `identifier`                     | `text`                                                                                                                         |
| `status`                         | `ReportStatusEnum` (a salary report submitted with all outliers deferred lands on `POSTPONED`; see "Report lifecycle")          |
| `equality_report_id`             | `fk → report` (nullable — set on `type = SALARY` rows, points to the approved equality report this salary was audited against) |
| `reviewer_user_id`               | `fk → doe_user` (nullable)                                                                                                     |
| `approved_at`                    | `timestamp` (nullable)                                                                                                         |
| `valid_until`                    | `timestamp` (nullable — approved_at + 3y; stamped `now()` on supersede)                                                        |
| `correction_deadline`            | `timestamp` (nullable — provisional name; never written today. See "Outlier deadlines")                                        |
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
| `additional_fixed_overtime` | `decimal(14, 2)` (nullable) |
| `additional_fixed_car_allowance` | `decimal(14, 2)` (nullable) |
| `bonus_occasional_car_allowance` | `decimal(14, 2)` (nullable) |
| `bonus_occasional_overtime` | `decimal(14, 2)` (nullable) |
| `bonus_payments`          | `decimal(14, 2)` (nullable) |
| `bonus_other`             | `decimal(14, 2)` (nullable) |
| `gender`                  | `GenderEnum`                |
| `report_employee_role_id` | `fk → report_employee_role` |
| `report_id`               | `fk → report`               |
| `score`                   | `decimal(6, 2)`             |

The two parent salary concepts are **derived, not stored**. Each is the sum of its
sub-component columns, with a `NULL` child treated as `0`:

- **viðbótarlaun** (`additionalSalary`) = `additional_fixed_overtime` + `additional_fixed_car_allowance`
- **aukagreiðslur** (`bonusSalary`) = `bonus_occasional_car_allowance` + `bonus_occasional_overtime` + `bonus_payments` + `bonus_other`

`ReportEmployeeModel` exposes both as computed getters and the API returns them
alongside the raw children. A `NULL` child means "not entered", distinct from an
entered `0` — only stored children carry that distinction; the derived parents
never do.

### `report_employee_role`

| Column  | Type      |
| ------- | --------- |
| `id`    | `uuid` PK |
| `title` | `text`    |

### `report_outlier_group`

Owns the improvement-plan explanation (`reason` / `action` / `signature_name` / `signature_role`) shared by the detected outliers assigned to it. A salary report can have multiple groups; each detected outlier belongs to exactly one group, and the explanation is written once per group. The four explanation columns moved here from `report_employee_outlier` (migration `m-20260616-outlier-groups.js`).

Every report with detected outliers always has at least one group. When a salary report is submitted with outliers postponed (parent `status = POSTPONED`), a single default group is created covering every detected outlier with its explanation columns left NULL; the applicant fills them in (or replaces the grouping) on resolve via `PUT /api/v1/application/reports/:providerId/outliers`. The reviewer cannot pick up a `POSTPONED` report (the resolve happens applicant-side); see "Outlier deadlines". `name` is always set.

| Column           | Type                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| `id`             | `uuid` PK                                                             |
| `report_id`      | `fk → report`                                                         |
| `name`           | `text`                                                                |
| `reason`         | `text` (nullable — null while postponed / not yet filled)             |
| `action`         | `text` (nullable — null while postponed / not yet filled)            |
| `signature_name` | `text` (nullable — null while postponed / not yet filled)            |
| `signature_role` | `text` (nullable — null while postponed / not yet filled)            |

Invariant (enforced via CHECK):

- The four explanation columns are either ALL NULL (postponed / not yet filled) or ALL non-null and non-empty (explained) — no half-filled groups. `name` is always non-null.

### `report_employee_outlier`

A thin join row pairing a detected outlier employee with its outlier group — one row per outlier the company has acknowledged at submission. The explanation/signature fields no longer live here (they moved up to `report_outlier_group`); this table is now just `report_employee_id` + `group_id`. `group_id` is `NOT NULL` — every outlier always belongs to a group.

Postponement is all-or-none across the report — encoded in `report.status` (`POSTPONED` ⇔ the default group's explanation columns are NULL). The submit-side outlier guard requires every detected outlier to have a row here; extras (rows for non-outliers) are rejected. The applicant resolves postponement via the outliers edit endpoint, which atomically fills the group explanations and flips status `POSTPONED → SUBMITTED`.

| Column               | Type                            |
| -------------------- | ------------------------------- |
| `id`                 | `uuid` PK                       |
| `report_employee_id` | `fk → report_employee`          |
| `group_id`           | `fk → report_outlier_group`     |

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
| `outlier_analysis_snapshot`           | `jsonb` regression-based salary outlier analysis snapshot                     |

`base_snapshot` and `full_snapshot` share the same shape:

- `totals`
  - `overall`, `male`, `female`, `neutral` — each contains `average`, `median`, `minimum`, `maximum`. Note: `neutral` is bundled into `female` and is therefore always empty — see "Gender bundling" under Results aggregation.
  - `salaryDifferences` — contains `maleFemale`, `maleNeutral`, `femaleMale`, `femaleNeutral`, `neutralMale`, `neutralFemale`. Only the male/female pairs are populated; the neutral pairs are always `null`.
- `scoreBuckets[]`
  - `rangeFrom`, `rangeTo`
  - `totals` with the same aggregate shape as above
  - `counts` for `overall`, `male`, `female`, `neutral` (`neutral` always `0`)

`outlier_analysis_snapshot` stores:

- `method` — currently `BASE_SALARY_LINEAR_REGRESSION_BY_SCORE`.
- `thresholdPercent` and `allowedDifferencePercent` — the configured threshold and the half-threshold band used for detection.
- `regression` — slope/intercept and basic fit metadata for adjusted base salary by score.
- `employees[]` — per employee ordinal: score, gender, adjusted base salary, predicted base salary at that exact score, score-bucket range, percent difference, direction, and `isOutlier`.

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
| `system_decision`   | `report_event_system_decision_enum` (`AutoReviewDecisionEnum`; nullable — set only on `SYSTEM_AUTO_REVIEW`; see "System auto-review") |

Invariants (enforce via CHECK):

- `event_type = 'STATUS_CHANGED'` ⇒ `from_status IS NOT NULL AND to_status IS NOT NULL AND report_status = to_status`.
- `event_type = 'ASSIGNED'` ⇒ `assigned_user_id IS NOT NULL`.
- `event_type = 'SUPERSEDED'` ⇒ `related_report_id IS NOT NULL`.
- `event_type = 'SUBMITTED'` ⇒ `company_id IS NOT NULL`.

A `WITHDRAWN` event (auto-withdrawal on sibling resubmission) carries `related_report_id` pointing at the replacing report, mirroring `SUPERSEDED`; applicant-initiated withdrawal is recorded as a `STATUS_CHANGED` event instead (see "Report lifecycle"). `system_decision` is set only on `SYSTEM_AUTO_REVIEW` events. These are application-layer conventions, not DB CHECK constraints.

### `report_comment`

Human-written message on a report. Immutable after insert (no edit). Soft-deletable by author; deleted rows hidden from the rendered thread.

| Column           | Type                                                           |
| ---------------- | -------------------------------------------------------------- |
| `id`             | `uuid` PK                                                      |
| `report_id`      | `fk → report`                                                  |
| `author_kind`    | `CommentAuthorKindEnum` (`REVIEWER` or `COMPANY`)              |
| `author_user_id` | `fk → doe_user` (nullable — set when `author_kind = REVIEWER`) |
| `visibility`     | `CommentVisibilityEnum`                                        |
| `body`           | `text`                                                         |
| `report_status`  | `ReportStatusEnum` (snapshot at insert)                        |
| `deleted_at`     | `timestamp` (nullable — soft delete by author)                 |

Invariants (enforce via CHECK):

- `author_kind = 'REVIEWER'` ⇒ `author_user_id IS NOT NULL`.
- `author_kind = 'COMPANY'` ⇒ `author_user_id IS NULL AND visibility = 'EXTERNAL'` (company admins cannot post internal comments).

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

### `job_runs`

Distributed-lock bookkeeping for cron tasks. Backs `AdvisoryLockService` (`@dmr.is/shared-modules`), which uses it to prevent duplicate task runs across multiple API containers within a cooldown window — currently the report-deadline-reminder task (migration `m-20260623-report-deadline-reminder-task.js`). One row per job type.

| Column         | Type                                                            |
| -------------- | --------------------------------------------------------------- |
| `job_key`      | `integer` PK (job-type id from `DOE_TASK_JOB_IDS`)              |
| `last_run_at`  | `timestamptz` (when the job last ran)                           |
| `container_id` | `text` (nullable — container/pod that ran the job, for debug)   |

No FKs, no relationships. Standalone bookkeeping table.

## Relationships (summary)

- `company` ⟷ `report` via `company_report` (per-submission snapshot, with optional parent company).
- `report` 1:N `report_criterion` 1:N `report_sub_criterion` 1:N `report_sub_criterion_step`.
- `report` 1:N `report_employee` N:1 `report_employee_role`.
- `report_employee` 1:N `report_employee_outlier` N:1 `report_outlier_group`; `report` 1:N `report_outlier_group` (the group owns the shared explanation/signature fields).
- `report_employee_role` ⟷ `report_sub_criterion_step` via `report_employee_role_criterion_step`.
- `report_employee` ⟷ `report_sub_criterion_step` via `report_employee_personal_criterion_step`.
- `report` 1:1 `report_result`; optional future role snapshots are `report_result` 1:N `report_role_result` N:1 `report_employee_role`.
- `report` 1:N `public_report` (one public snapshot per approval; new approvals insert new rows).
- `report` → `report` self-ref via `equality_report_id` (salary row points to the approved equality row it was audited against).
- `report` N:1 `doe_user` via `reviewer_user_id` (DoE reviewer who accepted/denied).
- `report` 1:N `report_event`; `doe_user` 1:N `report_event` via `actor_user_id` (nullable) and `assigned_user_id` (nullable, set on `ASSIGNED`); `company` 1:N `report_event` via `company_id` (nullable, set on `SUBMITTED`).
- `report` 1:N `report_comment`; `doe_user` 1:N `report_comment` via `author_user_id` (nullable, set when `author_kind = REVIEWER`).
- `company` 1:N `company_event`; `doe_user` 1:N `company_event` via `actor_user_id` (nullable).
- `company` 1:N `company_comment`; `doe_user` 1:N `company_comment` via `author_user_id` (nullable).
- `company` N:1 `postcode` N:1 `region`; `company` N:1 `isat_category` via `isat_category_code`.
- `job_runs` standalone (no FKs).

## Notes / open questions

- **Retraction flow deferred.** If a critical error surfaces in an already-approved public report, flow TBD. `ReportStatusEnum` is open for a future `RETRACTED` value; `public_report` columns for retraction (e.g. `retracted_at`, `retraction_reason`, `replaced_by_id`) not added yet.
- **Fines.** Daily fines are a company-level flag (`company.fines_started`), toggled by an admin; the fines themselves are handled outside this system. No accrual table, no cron (see [Fines accrual](#fines-accrual)).
- **Scope.** This schema targets companies with ≥50 employees. Smaller-company flows + edge cases (mergers, liquidation, exemptions) TBD.
- **Cascade vs soft-delete.** Postgres `ON DELETE CASCADE` only fires on real `DELETE` rows. Lifecycle here is status-based, not soft-delete — do not add `deleted_at` to children expecting cascade propagation.
- **Outlier-preview endpoint.** Lands as `POST /api/v1/application/reports/salary-analysis` in the `application` module. Takes the unsaved parsed payload, computes employee scores with `report/lib/employee-scores.ts`, runs the canonical `detectOutliers(...)` helper from `report/lib/compensation-aggregates.ts` (half the configured `salary_difference_threshold_percent` around each employee's predicted adjusted base salary on the score regression line), and returns the flagged employees plus the gender-vs-score chart so the company can verify before submitting.
- **Submit-side outlier guard.** Wired into `report-create.service.ts.createSalary()` alongside the preview endpoint. Uses the same `detectOutliers(parsed, threshold)` helper as the preview to assert: every detected outlier has an `outliers[]` row, and every `outliers[]` row references a detected outlier (extras are rejected). Threshold is re-read from `config` at submission time, so a small drift between preview and submit is possible — rejection in that case just means "re-run preview". The submit `outliersPostponed` input flag lets a company acknowledge every outlier without filling explanations immediately; postponement applies to the whole report and lands the row in `POSTPONED` status. The applicant resolves it later via the outliers edit endpoint.
