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

- **Leaf codes only on the company.** `isat_category` is seeded with the 665 leaf (5-digit, two-dot) ÍSAT2008 codes, and a company is always classified at its own leaf — groups and classes are not stored.
- **Section and division are stored on the leaf, for rollup filtering.** `isat_category.division` is the 2-digit prefix (`01110` → `01`), and `isat_category.section` is the ÍSAT bálkur letter (`A`–`U`, or `X`), a FK into the 22-row `isat_section` reference table. Section is _not_ arithmetic on the division but it is a **total function** of it, via the fixed NACE Rev. 2 division→section table encoded in the `isat_section_for_code()` SQL function — the single source of truth used both by the backfill and by `db/seeders/seed-isat-category.js`. A division outside NACE yields NULL and trips the `NOT NULL`, rather than silently misfiling the row. This mirrors `postcode → region`: the rollup is reached by joining and is never denormalized onto the company.
  - **`X` (Óþekkt starfsemi) is the one exception to the division rule.** ÍSAT2008 adds it on the fifth digit and NACE has no equivalent, so division `99` holds both `99.00.0` (extraterritorial organisations → `U`) and `99.99.9` (unknown activity → `X`). `isat_section_for_code()` matches `99999` on the whole code, ahead of the division rules. Mapping it by division instead would file every company of unknown activity under `U` and surface them in the section filter as embassies.
  - Icelandic section names in `isat_section` are verbatim from [Hagstofan's ÍSAT2008 handbook](https://hagstofa.is/media/49171/isat2008.pdf); English names are the official NACE Rev. 2 section titles. Don't reword them.
- **Normalized code is the key.** `isat_category.code` is the normalized 5-digit form (`01110`). The dotted form (`01.11.0`) is kept alongside for display only. Company-level classification is always the normalized code.
- **Admin-owned.** `company.isat_category_code` is set and kept current by DoE admins, in the same spirit as the `salary_report_required*` flags — not supplied by company admins at submission. It is refreshed by a **manual job run once a year** against an admin-uploaded company-info file.
- **Snapshot independence.** `company.isat_category_code` and `company_report.isat_category` are unrelated. The latter is a free-text dotted code frozen at submission (a snapshot is just a snapshot); the former is the live admin-maintained classification. The submission flow never reads from or writes to the company-level value, and `company_report` is never updated when the company's classification changes.

> **Subject to change.** This is an interim design while the feature is in development. The long-term intent is to source classification directly from the RSK API once we have access; until then, the annual admin-uploaded file is the source of truth. The stored format (normalized leaf code) and admin ownership may change when that integration lands.

## Sector (private vs government/state)

ÍSAT says what an entity **does**, not who owns it — a state-owned hospital and a private clinic both sit in `86xxx`, so section `O` (public administration) cannot answer "private vs government/state" on its own. `company.sector` is that separate axis, an enum of `UNKNOWN | PRIVATE | PUBLIC` derived from RSK's registered legal form (rekstrarform).

- **The raw legal form is stored too.** `company.legal_form_id` and `legal_form_name` keep RSK's own values alongside the derived `sector`. The id→sector mapping is currently **inferred, not confirmed against live payloads**; keeping the raw id means a corrected mapping can be re-derived with one local `UPDATE` instead of re-sweeping RSK, which matters because the registry has **no bulk endpoint** — only `GET /{nationalId}`, one call per company.
- **`UNKNOWN` is first-class and never collapsed into `PRIVATE`.** An admin filtering for private companies must not be silently shown companies we merely failed to classify. Unmapped legal-form ids stay `UNKNOWN` and are logged so the real vocabulary surfaces from production traffic.
- **`sector_override` protects manual corrections**, exactly like `salary_report_required_override`: when an admin sets a sector by hand, any backfill must skip that row rather than reset it to `UNKNOWN`.
- **Not owned by the annual import.** Unlike the other authoritative company fields, the annual `.xlsx` carries no legal form, so the company import must leave `sector`, `sector_override`, and both `legal_form_*` columns untouched — this one column set is RSK- and admin-owned, not file-owned.
- **`MUNICIPAL`** (municipalities as distinct from central government) is a plausible future value; add it with `ALTER TYPE company_sector_enum ADD VALUE`.

**How rows actually get classified.** The three creation paths differ, and the difference matters when reading `sector` data:

- `CompanyService.create` (admin creates one company) — classified, from the same RSK call that supplies address/postcode/ÍSAT.
- `getOrCreateByNationalId` / `getOrCreateSubsidiaryReportSnapshotSource` (auto-provision) — classified, via one extra RSK call for the legal form only. These create from the _national_ registry, which carries no legal form. RSK's `status` is deliberately **not** taken here: a deregistered record would create the company `INACTIVE` and block the very submission that triggered the provisioning.
- `CompanyImportService` (annual `.xlsx`) — **not classified.** Rows are born `UNKNOWN`.

Most companies arrive through the import, so most of the register is `UNKNOWN` and stays that way until it is filled deliberately. That is a decision, not a gap: RSK has no bulk endpoint, the workbook carries no legal-form column, and `reconcile` runs for both preview and apply — so per-row lookups would mean thousands of HTTP calls, twice per import. **An automated RSK sweep was considered and ruled out.** Don't add one without revisiting that call.

The backlog is instead planned to be filled by a one-off bulk SQL `UPDATE` (ÍSAT section `O` is the sensible basis: high precision for public administration, low recall — it misses state-owned companies like RÚV ohf. that sit in other sections by activity), with `PATCH /company/:id/sector` covering the tail. Any such pass must skip `sector_override = true`.

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

- **`DRAFT`** — company admin is still editing. Not visible to reviewers. Most columns may be null. Created at "initial contact" from the application portal and built up incrementally through the report-draft CRUD endpoints (or bulk-seeded from a workbook); employee scores and the `report_result` snapshot are not persisted yet (derived on read). Emits no `report_event` rows and has no `company_report` snapshot until submit. The applicant may hard-delete it (permanent — all child data removed); abandoned drafts are pruned after 6 months. Transitions to `SUBMITTED` (or `POSTPONED` for a salary report whose outliers are acknowledged but not yet explained) on submit, which freezes scores + the result snapshot and creates the `company_report` snapshot.
- **`SUBMITTED`** — company finalized the submission. `created_at` is the submission timestamp for the row. Waits in reviewer queue.
- **`POSTPONED`** — applies to `SALARY` reports only. The company submitted with all outliers deferred (`outliers[]` rows persisted with null explanation columns). The report is **not pickable** by reviewers — `assign()` rejects this status, `approve()` rejects this status. The applicant resolves the postponement via `PUT /api/v1/application/reports/:providerId/outliers`, which fills in the explanation fields and transitions the row to `SUBMITTED` (emitting a `STATUS_CHANGED` + an `EDITED` event). Reviewers can read the report and its content while it sits here, but cannot act on it.
- **`IN_REVIEW`** — a reviewer has picked up the report. (If you want reviewer-assignment tracking, stamp `reviewer_user_id` on pickup; currently it's stamped on the final decision.) In-place applicant edits are allowed in this state via the two PUT endpoints (equality body / outliers), each emitting an `EDITED` event; status is preserved so the reviewer keeps their pickup.
- **`DENIED`** — reviewer rejected the submission. `reviewer_user_id` set on the report. Denial reason is stored on the `STATUS_CHANGED` event (`reason` column) rather than the report row — keeps the audit trail self-contained. **Terminal state.** This denied row stays as audit forever and is never mutated. The company submits afresh via the upstream application portal, which produces a new `provider_id` and a new `report` row.
- **`APPROVED`** — reviewer accepted. `approved_at` set, `valid_until = approved_at + 3 years`. The parent company's matching next-due column is advanced to the same `valid_until` (`next_salary_report_due_at` for a `SALARY` approval, `next_equality_report_due_at` for `EQUALITY`), keeping it the live source of truth for the renewal-window check. A `public_report` row is inserted as part of this transition. `approve()` additionally gates on every outlier row having all four explanation fields filled — a belt-and-suspenders check on top of the `POSTPONED → SUBMITTED` resolution flow.
- **`SUPERSEDED`** — a newer report **of the same `type`** from the same company has been approved. Old `valid_until` gets stamped to `now()`. This does **not** touch the company's `next_*_report_due_at` — that was already advanced to the new report's `valid_until` by the approval above; the superseded row is no longer the company's current obligation. Only one `APPROVED` report per `(company, type)` pair is "current" at any time — an approved `SALARY` does **not** supersede an approved `EQUALITY` and vice versa, since every company needs both kinds active simultaneously (equality universally, salary for ≥50-employee companies).
- **`WITHDRAWN`** — a report retired before any reviewer acted on it. **Terminal state.** Reached two ways, both before the report became live work:
  - **Auto-withdrawn on sibling resubmission.** When a company submits a new report of a given `type`, `report-create.service.ts` silently withdraws any still-`SUBMITTED` predecessor of the same type for that company (`withdrawOrRejectInflightSibling()`): the old row flips to `WITHDRAWN` and a `WITHDRAWN` `report_event` is emitted on it with `related_report_id` pointing at the new replacing report (mirroring `SUPERSEDED`). A prior report in `IN_REVIEW` or `POSTPONED` is **not** auto-withdrawn — those flows are active, so the new submission is rejected with 409 instead.
  - **Applicant-withdrawn.** `application.withdraw()` (`POST` on the application surface) sets a report to `WITHDRAWN` when the applicant deleted the originating island.is application upstream, emitting a `STATUS_CHANGED` event. Allowed only before a terminal state (`APPROVED`/`DENIED`/`SUPERSEDED`); idempotent on an already-`WITHDRAWN` report.

## What counts as an outlier (the compliance rule)

Read this before "Outlier deadlines" below — those deadlines hang off the definition here.

**Compliance is decided company-wide, on one figure.** The report's **óskýrður (leiðréttur)
launamunur** — the Oaxaca-Blinder unexplained term on `log(reglulegt tímakaup)`, frozen at submit in
`report_result.wage_gap_decomposition_snapshot.oskyrtPercent` — is compared to the statutory
benchmark in `config.salary_difference_threshold_percent` (3,9%). Above it, the company owes an
**áætlun um úrbætur**. Nothing is ever auto-rejected; every rejection is a human decision.

**The employees that plan must account for are the `lágmarksmengi`:** the _fewest_ underpaid members
of the disadvantaged gender whose correction brings óskýrt under the benchmark. Membership is flagged
per employee in the same snapshot (`employees[].inMinimumSet`) and persisted as
`report_employee_outlier` rows.

Three properties of that set are easy to get wrong:

- **It runs in both directions.** Candidates are everyone whose framlag shares the sign of óskýrt:
  the underpaid on the _disadvantaged_ side and the overpaid on the _advantaged_ side. Both pull the
  gap open. Nothing here proposes cutting anyone's pay — being listed obliges the employer to supply
  a reason and an action, and the counterfactual correction is how the list is chosen rather than a
  payment instruction. `employees[].payStatus` says which direction a given row is, and it must be
  rendered: the two are different questions.
- **It spans both genders**, therefore, where a lift-only set could not. In a mostly-female workforce
  with a few highly-paid men the set is usually mostly those men, because residuals sum to zero
  around the fit and a small advantaged group carries the whole positive side between few people —
  so the list gets SHORTER rather than longer.
- ⚠️ **Membership is a property of the SET, not of the person.** It comes from a greedy walk down the
  correctable employees ordered by their contribution, applying each one's counterfactual correction,
  **refitting**, and stopping once the recomputed gap is under the benchmark. Two employees on near-identical pay and score can land on opposite sides of the cut,
  and the honest answer to _"why me and not my colleague?"_ is "you carried more of the gap and N
  corrections were enough" — not anything about that person alone.

**Compliance is `oskyrtWithinBenchmark`.** Not the size of the set, and not
`minimumSetClosesGap` either — those answer different questions:

| Field                   | Answers                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `oskyrtWithinBenchmark` | **is this company compliant?**                                          |
| `minimumSetClosesGap`   | would correcting the listed employees land óskýrt inside the benchmark? |
| `minimumSetSize`        | how many employees the úrbótaáætlun must cover                          |

The flag is decided on the unrounded log figure, whereas comparing rounded percentages disagrees at
the boundary (óskýrt of `0,03978087001184605` against a threshold of `0,0397808700118446` is over the
line while the displayed percent rounds to exactly 3,9). Both the auto-review rule and the reviewer UI
read it for that reason.

⚠️ **An empty set does NOT imply a compliant gap.** It did until the walk became two-directional,
because the pool was never empty when óskýrt ≠ 0 (residuals sum to zero, so the disadvantaged cohort
always had a member below the line) and the first candidate was always committed — zero
counterexamples in 20.000 synthetic cohorts. The probe guard changed that: it declines a candidate
whose correction would push the gap further out, and it can decline **every** candidate. Minimal
reproduction, pinned by a spec: four employees on one starfsmatsstig, óskýrt 4,88%, two carriers,
nothing listed.

So an empty set now has three causes and only the first is compliance — already inside the benchmark,
nobody carries the gap, or every candidate overshoots. Read the flag.

### Retiring the ±band

Until 2026-08 compliance was decided **per employee**: fit a gender-blind line through
(starfsmatsstig, tímakaup) and flag anyone further than _half_ the statutory threshold (±1,95%) from
it. That rule is gone, along with `report_result.outlier_analysis_snapshot` which stored its verdicts
and the tolerance corridor both chart renderers used to shade.

Two consequences worth knowing when reading older code or data:

- **It changed _which_ employees are flagged, not just how many — twice.** Follow one
  six-employee cohort (`scenarioWithOutliers`) through all three rules:

  | Rule                          | Flagged                | Because                                                 |
  | ----------------------------- | ---------------------- | ------------------------------------------------------- |
  | ±1,95% band                   | the overpaid man       | he deviated furthest from the line, in either direction |
  | lift-only lágmarksmengi       | two underpaid women    | only the underpaid disadvantaged side was eligible      |
  | two-directional lágmarksmengi | the overpaid man again | he carries more of óskýrt than the two women together   |

  The first and last agree on the person and on nothing else. The band flagged him for a fact about
  him alone and decided nothing; the current rule lists him because the company's gap runs through
  him, and asks the employer to account for it. This is why membership is always derived from
  `employees[].inMinimumSet` and never hardcoded in a seeder or a fixture — and the same holds for
  the ábendingar list below, which is derived from the snapshot on read and must likewise never be
  seeded as data.

  ⚠️ Nor are the ábendingar of the next subsection the band returning. The band was a **fixed
  per-person width** that _decided compliance_; ábendingar are measured in the company's own pay
  spread, run only after compliance has already been settled, and oblige the employer to nothing. A
  fixed 20%-off-expected rule would flag 28 of the 120-employee reference cohort and 45 of 100 on richSheet,
  because the spread itself is roughly that wide — that is the band's failure with a bigger
  constant.

- **The set is far smaller, and that is not a proxy for severity.** It is _minimal by construction_,
  so a small set can mean a concentrated problem rather than a mild one. On a 100-employee reference
  cohort the band flagged 100; the lágmarksmengi is 6.

### Ábendingar — a second list, with no obligation

⚠️ **Everything above is the _compliance_ rule. It is not the only list on a salary report.**

`report-statistics/lib/pay-dispersion.ts` derives a second, **informational** list — _ábendingar_ —
answering a different question: not _who carries the company's gender gap_ but _whose pay is far from
what their starfsmatsstig imply_. The employer owes **nothing** for it: no reason, no action, no
signature, no submission, and it can never be a basis for rejection or an auto-review input.

It exists because óskýrt is a difference between the cohorts' **mean** deviations, so deviations that
offset each other inside one cohort cancel exactly. A company can sit well under 3,9% while
individuals are a long way off the line — so "compliant" means _no aggregate gender gap_, not _no
individual pay problems_. Roughly half of any workforce (47 of 120 on the reference cohort) sits in
quadrants the lágmarksmengi structurally cannot reach, because correcting them would widen the very
figure the statute tests.

Selection is `|studentized residual| ≥ 2` — two of the company's **own** pay spreads from the fitted
line, leverage-corrected — with a floor of 12 analysed employees, below which the statistic cannot
fire arithmetically. Two populations: `ALL_EMPLOYEES` on a compliant company, and
`EXCLUDING_MINIMUM_SET` on one over the benchmark, where members of the lágmarksmengi are withheld so
nobody appears in two tables under two framings. **Only `ALL_EMPLOYEES` is rendered today.**

⚠️ **Withheld on `inMinimumSet`, never on `widensGap`.** The set is only the few carriers the
selection walk picked — the reference company has 73 carriers and 5 in the set, and the other 68 stay
eligible. See [`docs/launagreining.md`](../docs/launagreining.md) §10 for the statistic, the
consequence boundary and the worked example.

**Naming is deliberately unchanged.** `report_employee_outlier`, `report_outlier_group`, the
`/outliers` endpoints and the úrbótaáætlun UI all keep the word "outlier". Renaming the flow would
churn the schema, every endpoint and the web for vocabulary; what changed is the membership rule, not
the plumbing.

## Outlier deadlines

> **Status:** this section describes the intended domain model. It is **subject to change** and largely **not yet implemented** — see "Implementation status" at the end. The single `report.correction_deadline` column exists today but is never written, and the email / fine actions below do not exist yet.

A **`SALARY` report that contains outliers** can carry up to **two** distinct deadline dates. Both are measured from the **report submission date** (`created_at` on the row when it reaches `SUBMITTED`). A salary report with **no** detected outliers needs neither — there is nothing to correct or explain. `EQUALITY` reports are not subject to either deadline.

The column is currently named `correction_deadline`, which is a poor fit because two different concepts are in play. Treat the name as provisional.

### 1. Outlier correction deadline (the "fix the gap" clock)

Every salary report **with outliers** gets a deadline to actually _correct_ the pay gap. This is a fixed policy, not a per-report or reviewer-set value:

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

**Uniqueness.** A partial unique index on `(provider_type, provider_id) WHERE provider_id IS NOT NULL` enforces one-row-per-tuple at the DB level. The application layer in `report-create.service.ts` also short-circuits on replay: if a non-null `(provider_type, provider_id)` already exists _and the submitting company matches the existing row's parent_, the create returns the existing `reportId` instead of inserting. That makes upstream network retries transparent — same payload + same key = same response. Cross-company collisions on the same tuple (an unlikely but theoretically possible "a new provider channel emits an id that an existing channel already used" scenario) are rejected with a 409.

## Report identifier

`report.identifier` is a six-uppercase-letter handle (`KTPQZW`) that exists so a report can be referred to — in a ticket, an email, a phone call — without quoting the company's kennitala. It carries no meaning and is derived from nothing about the report; that is the point. It is also what the admin report search matches on (`report/utils/filters.ts`), and it prints on the equality PDF.

**Who assigns it.** The server, always. No request DTO carries an `identifier` field, and no caller may choose one. `ReportIdentifierService.allocate` mints it: `ReportCreateService` on insert (both the applicant direct-submit and the admin-created paths), `ReportDraftSubmitService` at submit for a draft-born report.

**Why a DRAFT has none.** A draft is invisible to reviewers until it is submitted, and abandoned drafts are reaped after six months — a code handed out at draft-create would be spent on a row that may never exist. So `identifier` is NULL for the whole DRAFT phase and stamped once, at submit.

**Uniqueness.** A partial unique index (`report_identifier_unique_idx`, `WHERE identifier IS NOT NULL`) guarantees no two reports share a code; NULL drafts coexist freely. `allocate` additionally probes with `count` before returning a candidate, which removes the birthday collision against committed rows (~17k reports for a 50% chance of some pair colliding) without ever reaching an error path. The probe cannot close the concurrent window — under the request's CLS transaction it cannot see another request's uncommitted insert at all — so the index is what actually enforces it, rejecting the write rather than storing an identifier the admin search would find twice.

A rejected write is mapped to **503** by `rethrowReportWriteError`, not the 400 that `SequelizeExceptionFilter` gives every `UniqueConstraintError` by default. The distinction matters: the payload was fine and retrying succeeds, so a 400 would tell island.is a good submission was malformed and must not be retried. There is no in-place retry — probe and insert share the request's CLS transaction, so catching the violation leaves it aborted, and a `SAVEPOINT` on every report creation is not worth an event with a ~1-in-309M chance per concurrent pair.

**Release coordination (#1406).** `identifier` used to be a field on every creation payload — `CreateReportDto`, `CreateEqualityReportDto`, `SubmitSalaryReportDto`, `SubmitEqualityReportDto` — and was removed when minting moved server-side. The global `ValidationPipe` runs `whitelist: true` with **no** `forbidNonWhitelisted`, so a caller still sending one gets no error: the field is silently stripped and a different code is minted. That failure is invisible on both sides — if island.is persists or displays the code it sent, the applicant quotes a handle the reviewer's identifier search (`report/utils/filters.ts`) will never match. **The island.is client must stop sending `identifier` and read it back from the report response instead** (`GET /application/reports/:providerId` → `ApplicationService.getReport`). No deploy ordering is required in either direction; the only requirement is that the client is updated.

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
- `PUT /api/v1/application/reports/:providerId/outliers` — replaces outlier explanations on a `SALARY` report. All-or-none: the submitted set must match the lágmarksmengi exactly (read from `report_result.wage_gap_decomposition_snapshot.employees` filtered to `inMinimumSet = true`); duplicates, extras, or missing rows all reject 400. Allowed in two statuses:
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

## Salary-data basis

A salary report's figures come from one of two places, and which one it is changes how the numbers should be read — so the submittee declares it rather than us inferring it. `report.salary_data_basis` carries the declaration:

- `MONTH` — the figures are one specific payroll month's. Which month is in `report.salary_data_period`, stored as a `date` on the 1st (the value has month precision; any day a client sends is normalised to the 1st).
- `AVERAGE` — the figures are a twelve-month average. No single month applies, so `salary_data_period` stays `NULL`.

Both columns are nullable at the DB level, because the same table holds `EQUALITY` rows (no salary data at all) and because a `SALARY` row starts as a `DRAFT` that is filled in field by field — the applicant may pick the basis in one PATCH and the month in the next. Requiredness is therefore a **submit-time** rule, enforced identically on all three submit paths (application portal, admin web, draft submit): the basis must be declared, and a `MONTH` basis must name its month, or the submit is rejected with 400. Reports submitted before the field existed are `NULL` on both columns.

Two CHECK constraints hold the invariants that are true at every point in a draft's life, so they never block an in-progress edit: an `AVERAGE` basis never carries a month, and a stored month is always the 1st. Declaring `AVERAGE` clears any month already entered, so a basis switch cannot leave a stale month behind.

## Criteria scoring (how a report is evaluated)

Each report is evaluated against a set of weighted criteria:

- `report_criterion` — top-level buckets (e.g. "equal pay for equal work"). Each has a `weight` and a `type` (`STATIC`, `CONDITION`, `CONTINUOUS`, `PERSONAL`).
- `report_sub_criterion` — sub-buckets within a criterion, also weighted.
- `report_sub_criterion_step` — ordered scoring steps within a sub-criterion. Each step has a `score`.
- Which steps apply to which role is captured in `report_employee_role_criterion_step`.
- Which steps apply to a specific employee personally is captured in `report_employee_personal_criterion_step`.
- Salary outlier justifications (special circumstances) are grouped in `report_outlier_group` — each group owns the shared `reason`, `action`, and signature fields — with `report_employee_outlier` joining each detected outlier employee to its group.

The final `score` on `report_employee` is derived from the steps that apply to that employee — the sum of `report_sub_criterion_step.score` across the steps reachable via the employee's role (`report_employee_role_criterion_step`) and via their personal assignments (`report_employee_personal_criterion_step`), with steps assigned through both sources counted once. The total is computed at submission and persisted on the row; reviewers read it as-is. While a report is still a `DRAFT` the score is **not** persisted (`report_employee.score` is `NULL`) — it is derived on read for the applicant's preview and only frozen onto the row at submit.

## Results aggregation

`report_result` holds one immutable report-level snapshot of **reglulegt tímakaup** — `(baseSalary + additionalSalary + bonusSalary) / paidHours`, where `additionalSalary` / `bonusSalary` are the derived sums of their sub-component columns (see `report_employee`). It is stored as JSONB because the service reads results by `report_id` rather than querying individual metrics in SQL, and it carries report-level totals plus score-bucket breakdowns.

There was previously a _second_ snapshot for base pay alone (`baseSalary / workRatio`). It is gone, and not merely as a simplification: with an **hours** denominator, dividing a base-pay-only numerator by hours that include the overtime which earned the additional and bonus pay is arithmetically incoherent. Under the old full-time-equivalent divisor both variants were coherent; under this one, only the total-pay numerator is. The column is named `salary_snapshot` rather than reusing `base_snapshot` so the name cannot outlive the meaning.

The same row also snapshots the **Oaxaca-Blinder decomposition** (`wage_gap_decomposition_snapshot`): the two displayed gap figures, the pooled fit on `log(tímakaup)`, each employee's contribution to the unexplained term, and the lágmarksmengi derived from it. `oskyrtPercent` there is the figure the statutory benchmark tests — _not_ `salary_snapshot.totals.salaryDifferences.maleFemale`, which is the unadjusted cohort-mean gap; the two land on opposite sides of the line on real data.

There was previously a third snapshot, `outlier_analysis_snapshot`, holding a per-employee ±1,95% verdict against a fitted line plus four level-space regressions. It retired with the band: compliance is decided company-wide now, and the employees an úrbótaáætlun must account for are the lágmarksmengi. Its regression block was read by nothing — the chart computes its own line at request time. `report_role_result` was dropped in the same batch: written by no code path since it was created, and the last holder of the retired base/full pair.

The row is write-once at submission — computed in the same transaction that persists the report, so reviewers can read the aggregates as soon as they pick the report up. It is not edited by humans, and the approval transition does not recompute it. (Contrast with `public_report`, which is published only on the `APPROVED` transition.)

### Gender bundling: NEUTRAL counts as FEMALE (M vs F+N)

The current product goal is to measure the pay gap between men and women, expressed as **MALE vs FEMALE+NEUTRAL**. So for every aggregation, count, gender-split regression and chart series, `NEUTRAL` employees are **bundled into the `FEMALE` group**. Concretely:

- `totals.female` / bucket `female` averages, medians and counts **include** neutral employees; `maleFemale` is therefore the gap of male vs (female + neutral).
- The standalone `neutral` cohort (metrics, counts, `regressions.neutral`) is consequently **always empty** in computed output — `null` metrics, `0` counts.
- The gender-blind `regressions.overall` and the outlier flag are unaffected: they already include every employee regardless of gender, and neutral employees are still flagged like anyone else.
- On the chart (admin web + PDF) neutral scatter points render in the purple "Kona" (female) series.

This is a **reclassification at computation/display time only** — raw `report_employee.gender` keeps the real `NEUTRAL` value, so the data is preserved for a future standalone neutral category. The rule is centralised in `bundleNeutralIntoFemale()` (`report/lib/compensation-aggregates.ts`) so it is easy to reverse. Decision date: 2026-06.

### Reconstructing the gender-vs-score chart from a stored result

The same chart shape that `buildChartFromEmployeePoints` produces for the application-side preview can be rebuilt from a persisted `report_result` row:

- **Scatter points** — `wage_gap_decomposition_snapshot.employees[*]` carries `score`, `gender` and `hourlyWage` per employee.
- **Expected-pay curve** — each employee's `expectedHourlyWage` is `exp(fitted)` from `pooledFit`, so in krónur space the model is a curve rather than a straight line. Both renderers draw that curve: the admin chart samples it, and `report-pdf/lib/salary-chart-svg.ts` does the same.

  ⚠️ The live chart endpoint still returns a `regressionLine` fitted in **level space**, and it is now read by **nothing** — the PDF was its last consumer and was moved to `pooledFit`, because drawing a level line beside a table of log-fit figures let the two contradict each other (they disagree by 45,6% at the bottom of the demo cohort's score range). It remains on the wire only because removing it means touching the DTO and regenerating the client. Do not wire it up again.

- **Score-bucket overlay** — bucket-level aggregates (median, average, gender breakdowns, counts) live in `salary_snapshot.scoreBuckets`. Join on the bucket range when an overlay is needed. Per-employee bucket placement is no longer stored: it existed for the retired band.
- **No tolerance band.** The chart used to shade `predicted × (1 ± allowedDifferencePercent / 100)` and call points outside it outliers. That rule is gone — see "Retiring the ±band" under "What counts as an outlier" — and nothing shades a corridor now, because a corridor that decides nothing while looking exactly as it did would read as a finding.
- **Highlighting** — mark `inMinimumSet` employees if the chart needs to show who the úrbótaáætlun covers.

Bucket placement is informational only, and always was. Compliance is decided by the company-wide óskýrt figure against the benchmark — never by an individual's distance from any line, bucket median or otherwise.

## Enums

| Enum                      | Values                                                                                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GenderEnum`              | `MALE`, `FEMALE`, `NEUTRAL`                                                                                                                                                                                                                                               |
| `ReportProviderEnum`      | `SYSTEM`, `ISLAND_IS`, `OTHER`                                                                                                                                                                                                                                            |
| `ReportCriterionTypeEnum` | `RESPONSIBILITY`, `STRAIN`, `CONDITION`, `COMPETENCE`, `PERSONAL`                                                                                                                                                                                                         |
| `ReportStatusEnum`        | `DRAFT`, `SUBMITTED`, `POSTPONED`, `IN_REVIEW`, `DENIED`, `APPROVED`, `SUPERSEDED`, `WITHDRAWN`                                                                                                                                                                           |
| `ReportTypeEnum`          | `SALARY`, `EQUALITY`                                                                                                                                                                                                                                                      |
| `SalaryDataBasisEnum`     | `MONTH`, `AVERAGE`                                                                                                                                                                                                                                                        |
| `ReportEventTypeEnum`     | `SUBMITTED`, `ASSIGNED`, `UNASSIGNED`, `STATUS_CHANGED`, `SUPERSEDED`, `EDITED`, `WITHDRAWN`, `SYSTEM_AUTO_REVIEW`                                                                                                                                                        |
| `AutoReviewDecisionEnum`  | `AUTO_APPROVE`, `NEEDS_REVIEW`                                                                                                                                                                                                                                            |
| `CompanyStatusEnum`       | `ACTIVE`, `INACTIVE`                                                                                                                                                                                                                                                      |
| `CompanySizeEnum`         | `UNKNOWN`, `SMALL`, `MEDIUM`, `LARGE`                                                                                                                                                                                                                                     |
| `CompanyEventTypeEnum`    | `CREATED`, `STATUS_CHANGED`, `FINES_STARTED`, `FINES_STOPPED`, `QUARANTINED`, `UNQUARANTINED`, `EQUALITY_REPORT_DEADLINE_REMINDER_SENT`, `SALARY_REPORT_DEADLINE_REMINDER_SENT`, `EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL`, `SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL` |
| `CompanyReminderTierEnum` | `SIX_MONTHS`, `TWO_MONTHS`, `TWO_WEEKS`, `DUE`                                                                                                                                                                                                                            |
| `CommentVisibilityEnum`   | `INTERNAL`, `EXTERNAL`                                                                                                                                                                                                                                                    |
| `CommentAuthorKindEnum`   | `REVIEWER`, `COMPANY`                                                                                                                                                                                                                                                     |

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

| Column                            | Type                                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `id`                              | `uuid` PK                                                                                                                  |
| `name`                            | `text`                                                                                                                     |
| `employee_count_category`         | `company_size_enum` (`UNKNOWN`/`SMALL`/`MEDIUM`/`LARGE`)                                                                   |
| `national_id`                     | `text` (unique)                                                                                                            |
| `status`                          | `company_status_enum` (`ACTIVE`/`INACTIVE`)                                                                                |
| `email`                           | `text` (nullable — admin-set contact email; read by the report-deadline-reminder task)                                     |
| `address`                         | `text` (nullable)                                                                                                          |
| `postcode_id`                     | `fk → postcode` (nullable)                                                                                                 |
| `salary_report_required`          | `boolean`                                                                                                                  |
| `salary_report_required_override` | `boolean`                                                                                                                  |
| `fines_started`                   | `boolean` (default `false`)                                                                                                |
| `quarantined`                     | `boolean` (default `false`)                                                                                                |
| `next_equality_report_due_at`     | `timestamptz` (nullable — seeded, then advanced to `valid_until` on each EQUALITY approval)                                |
| `next_salary_report_due_at`       | `timestamptz` (nullable — seeded, then advanced to `valid_until` on each SALARY approval; gates the salary renewal window) |
| `isat_category_code`              | `text` `fk → isat_category(code)` (nullable)                                                                               |

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

| Column          | Type                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `id`            | `uuid` PK                                                                                                 |
| `company_id`    | `fk → company`                                                                                            |
| `event_type`    | `CompanyEventTypeEnum`                                                                                    |
| `actor_user_id` | `fk → doe_user` (nullable — null for cron/system; set for admin actions)                                  |
| `status`        | `company_status_enum` (snapshot of the company status at insert)                                          |
| `from_status`   | `company_status_enum` (nullable — set on `STATUS_CHANGED`)                                                |
| `to_status`     | `company_status_enum` (nullable — set on `STATUS_CHANGED`)                                                |
| `reason`        | `text` (nullable — optional reason; for reminder events holds the ISO due date)                           |
| `reminder_tier` | `company_reminder_tier_enum` (`CompanyReminderTierEnum`; nullable — set only on deadline-reminder events) |

Invariant (enforced via CHECK):

- `event_type = 'STATUS_CHANGED'` ⇒ `from_status IS NOT NULL AND to_status IS NOT NULL AND status = to_status`.

### `company_comment`

Internal, admin-authored note attached to a company. Unlike `report_comment` there is **no** visibility/author-kind dimension — company comments are reviewer-internal only (companies never see them); the author is always an admin `doe_user`. Soft-deletable so the timeline stays auditable; deleted rows are hidden from the rendered thread.

| Column           | Type                                           |
| ---------------- | ---------------------------------------------- |
| `id`             | `uuid` PK                                      |
| `company_id`     | `fk → company`                                 |
| `author_user_id` | `fk → doe_user` (nullable)                     |
| `body`           | `text`                                         |
| `deleted_at`     | `timestamp` (nullable — soft delete by author) |

### `isat_category`

Reference table of ÍSAT2008 industry classifications, seeded from `ISAT_2008.json` (665 leaf codes — see [Industry classification](#industry-classification-ísat2008)). Read-only at runtime; refreshed only when the standard changes. `company.isat_category_code` FKs into `code`.

| Column           | Type                                  |
| ---------------- | ------------------------------------- |
| `code`           | `text` PK (normalized, e.g. `01110`)  |
| `code_dotted`    | `text` (display form, e.g. `01.11.0`) |
| `description`    | `text` (Icelandic)                    |
| `description_en` | `text` (English)                      |

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
| `salary_data_basis`              | `SalaryDataBasisEnum` (nullable — see "Salary-data basis")                                                                     |
| `salary_data_period`             | `date` (nullable — the payroll month, always the 1st; set only when `salary_data_basis = MONTH`)                               |
| `provider_type`                  | `ReportProviderEnum` (upstream channel — see "Provider correlation")                                                           |
| `provider_id`                    | `text` (nullable; upstream submission ID — see "Provider correlation". Unique with `provider_type` when not null.)             |
| `imported_from_excel`            | `boolean`                                                                                                                      |
| `identifier`                     | `text` (nullable; minted server-side, unique among non-null values — see "Report identifier")                                  |
| `status`                         | `ReportStatusEnum` (a salary report submitted with all outliers deferred lands on `POSTPONED`; see "Report lifecycle")         |
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

| Column                           | Type                                   |
| -------------------------------- | -------------------------------------- |
| `id`                             | `uuid` PK                              |
| `ordinal`                        | `int`                                  |
| `field`                          | `text`                                 |
| `department`                     | `text`                                 |
| `start_date`                     | `date`                                 |
| `paid_hours`                     | `decimal(6, 2)` CHECK > 0              |
| `base_salary`                    | `decimal(14, 2)`                       |
| `additional_fixed_overtime`      | `decimal(14, 2)` (nullable)            |
| `additional_fixed_car_allowance` | `decimal(14, 2)` (nullable)            |
| `bonus_occasional_car_allowance` | `decimal(14, 2)` (nullable)            |
| `bonus_occasional_overtime`      | `decimal(14, 2)` (nullable)            |
| `bonus_payments`                 | `decimal(14, 2)` (nullable)            |
| `bonus_other`                    | `decimal(14, 2)` (nullable)            |
| `gender`                         | `GenderEnum`                           |
| `report_employee_role_id`        | `fk → report_employee_role`            |
| `report_id`                      | `fk → report`                          |
| `score`                          | `decimal(6, 2)` (nullable — see below) |

`score` is **nullable**. It is derived from step assignments and is only
computed and frozen when the report is submitted, so it is `NULL` while the
report is a `DRAFT` (the applicant is still building it up); submitted reports
always carry a score. (Migration `m-20260630-report-employee-score-nullable`.)

The two parent salary concepts are **derived, not stored**. Each is the sum of its
sub-component columns, with a `NULL` child treated as `0`:

- **viðbótarlaun** (`additionalSalary`) = `additional_fixed_overtime` + `additional_fixed_car_allowance`
- **aukagreiðslur** (`bonusSalary`) = `bonus_occasional_car_allowance` + `bonus_occasional_overtime` + `bonus_payments` + `bonus_other`

`ReportEmployeeModel` exposes both as computed getters and the API returns them
alongside the raw children. A `NULL` child means "not entered", distinct from an
entered `0` — only stored children carry that distinction; the derived parents
never do.

### `report_employee_role`

Report-scoped: each role belongs to exactly one report (`report_id`), so a
report's roles can be listed, CRUD-ed, and cascade-deleted directly. (The FK was
added by migration `m-20260630-report-employee-role-report-id`, backfilled from
the report each role's employees belonged to.)

| Column      | Type          |
| ----------- | ------------- |
| `id`        | `uuid` PK     |
| `title`     | `text`        |
| `report_id` | `fk → report` |

### `report_outlier_group`

Owns the improvement-plan explanation (`reason` / `action` / `signature_name` / `signature_role`) shared by the detected outliers assigned to it. A salary report can have multiple groups; each detected outlier belongs to exactly one group, and the explanation is written once per group. The four explanation columns moved here from `report_employee_outlier` (migration `m-20260616-outlier-groups.js`).

Every report with detected outliers always has at least one group. When a salary report is submitted with outliers postponed (parent `status = POSTPONED`), a single default group is created covering every detected outlier with its explanation columns left NULL; the applicant fills them in (or replaces the grouping) on resolve via `PUT /api/v1/application/reports/:providerId/outliers`. The reviewer cannot pick up a `POSTPONED` report (the resolve happens applicant-side); see "Outlier deadlines". `name` is always set.

| Column           | Type                                                      |
| ---------------- | --------------------------------------------------------- |
| `id`             | `uuid` PK                                                 |
| `report_id`      | `fk → report`                                             |
| `name`           | `text`                                                    |
| `reason`         | `text` (nullable — null while postponed / not yet filled) |
| `action`         | `text` (nullable — null while postponed / not yet filled) |
| `signature_name` | `text` (nullable — null while postponed / not yet filled) |
| `signature_role` | `text` (nullable — null while postponed / not yet filled) |

Invariant (enforced via CHECK):

- The four explanation columns are either ALL NULL (postponed / not yet filled) or ALL non-null and non-empty (explained) — no half-filled groups. `name` is always non-null.

### `report_employee_outlier`

A thin join row pairing a detected outlier employee with its outlier group — one row per outlier the company has acknowledged at submission. ⚠️ **Only the lágmarksmengi ever produces rows here.** Ábendingar never do: this table means _the company has acknowledged this outlier at submission_, and an advisory has nothing to acknowledge. The explanation/signature fields no longer live here (they moved up to `report_outlier_group`); this table is now just `report_employee_id` + `group_id`. `group_id` is `NOT NULL` — every outlier always belongs to a group.

Postponement is all-or-none across the report — encoded in `report.status` (`POSTPONED` ⇔ the default group's explanation columns are NULL). The submit-side outlier guard requires every detected outlier to have a row here; extras (rows for non-outliers) are rejected. The applicant resolves postponement via the outliers edit endpoint, which atomically fills the group explanations and flips status `POSTPONED → SUBMITTED`.

| Column               | Type                        |
| -------------------- | --------------------------- |
| `id`                 | `uuid` PK                   |
| `report_employee_id` | `fk → report_employee`      |
| `group_id`           | `fk → report_outlier_group` |

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

| Column                                | Type                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                  | `uuid` PK                                                                                                                                                                                                                                                                                                                      |
| `report_id`                           | `fk → report` (unique)                                                                                                                                                                                                                                                                                                         |
| `salary_difference_threshold_percent` | `decimal(5, 2)` nullable threshold snapshot from `config` at time of creation                                                                                                                                                                                                                                                  |
| `calculation_version`                 | `text` (column default `v1`, but every row written by `ReportResultService` is stamped `v3` explicitly — the default only applies to a hand-written insert. `v2` had a lift-only lágmarksmengi and `isCorrectable`/`correctableCount` in the snapshot; `v1` evaluated FTE-adjusted monthly pay. Neither is comparable to `v3`) |
| `salary_snapshot`                     | `jsonb` reglulegt tímakaup aggregate snapshot                                                                                                                                                                                                                                                                                  |
| `wage_gap_decomposition_snapshot`     | `jsonb` Oaxaca-Blinder decomposition, NOT NULL                                                                                                                                                                                                                                                                                 |

`salary_snapshot` holds:

- `totals`
  - `overall`, `male`, `female`, `neutral` — each contains `average`, `median`, `minimum`, `maximum`. Note: `neutral` is bundled into `female` and is therefore always empty — see "Gender bundling" under Results aggregation.
  - `salaryDifferences` — contains `maleFemale`, `maleNeutral`, `femaleMale`, `femaleNeutral`, `neutralMale`, `neutralFemale`. Only the male/female pairs are populated; the neutral pairs are always `null`.
- `scoreBuckets[]`
  - `rangeFrom`, `rangeTo`
  - `totals` with the same aggregate shape as above
  - `counts` for `overall`, `male`, `female`, `neutral` (`neutral` always `0`)

`wage_gap_decomposition_snapshot` stores the output of the launagreining. For the methodology behind it — what the 3,9% test actually is, how the lágmarksmengi is picked, and what happens on a lopsided or single-gender workforce — see [`docs/launagreining.md`](../docs/launagreining.md).

⚠️ **Ábendingar are NOT in this snapshot.** They are derived on read from it — `employees[].residualLog`,
`employees[].score` and `pooledFit.{sampleCount,xMean,xSumSquares}` — by
`report-statistics/lib/pay-dispersion.ts`, and surfaced as `ReportResultDto.payDispersion`, a sibling
of `wageGapDecomposition` rather than a field inside it. Deliberate on three counts: an advisory rule
must stay tunable without rewriting published history (a regulatory figure must not); it therefore
needed no migration and no `calculation_version` bump, and works on every row already frozen; and it
is reproducible by anyone holding the published JSON. The DTO for `wageGapDecomposition` _is_ the
stored JSONB verbatim, so derived data inside it would break the identity the audit trail rests on.

`wage_gap_decomposition_snapshot` stores:

- `method` and `pooledReferenceMode` — `OAXACA_BLINDER_LOG_REGULAR_HOURLY_WAGE_BY_SCORE` under the pooled-OLS (Neumark) reference.
- `rawGapAvailable` / `oskyrtAvailable` with `rawGapBlockers` / `oskyrtBlockers` / `warnings` — enum codes only, no Icelandic. `counts` is always real numbers even when the figures are not computable, because "you have 4 women" is the actionable part of the message.
- `rawGapPercent` — **óleiðréttur**, on arithmetic means, so it reproduces from the two `meanHourlyWage*` figures printed beside it. Informational; no compliance role.
- `oskyrtPercent` — **leiðréttur**, the Oaxaca unexplained term. **This is the figure the statutory benchmark tests.** Direction is carried separately (`oskyrtDirection`) so the test stays direction-agnostic; percentages are magnitudes.
- `pooledFit` — the fit on `log(tímakaup)` vs stig. `xSumSquares` is the identifiability test, not `slope !== null`: a degenerate fit returns slope `0`.
- `employees[]` — per ordinal: score, gender, actual and expected tímakaup, deviation, residual, `contributionLog` (sums exactly to `oskyrtLog`), `contributionShare`, `payStatus`, `widensGap`, `inMinimumSet`.
- `gapCarrierCount`, `minimumSetSize`, `oskyrtWithinBenchmark`, `oskyrtLogAfterMinimumSet`, `oskyrtDirectionAfterMinimumSet`, `minimumSetClosesGap`, `thresholdLog`, `benchmarkPercent` — the **lágmarksmengi**: the fewest employees carrying óskýrt whose correction would bring it under the benchmark. This set — not any per-employee tolerance — is what the úrbótaáætlun must account for. `gapCarrierCount` is the pool it was selected from and is **not** a compliance signal; `oskyrtWithinBenchmark` is.

  **It is a selection device, not a prescription.** The counterfactual raise is how the list is chosen; nobody is being told to give it. The company files a reason and an action per listed employee, and improvement is demonstrated at company level at the next report. Which is why the wording around it stays remedy-neutral — the UI says the listed employees' pay is lower than their starfsmatsstig imply and asks for ástæður og aðgerðir, and deliberately does not name a fix.

  `oskyrtLogAfterMinimumSet` is **recomputed by refitting** with the set's lifts applied, not `|óskýrt| − Σ|framlag|`. The earlier subtraction held the pooled fit fixed, but β\*₁ is estimated from the very wages the counterfactual changes, so lifting anyone moves the line and every other residual with it. It was wrong in both directions — claiming compliance for cohorts still over the benchmark, and elsewhere padding the set with members it did not need.

  The lift targets are each employee's `expectedHourlyWage` **as published in `employees[]`**, so the figure is reproducible: take the set, raise each member to the printed `Væntanlegt tímakaup`, re-run the engine, land on `oskyrtLogAfterMinimumSet`.

  ⚠️ **Read `oskyrtWithinBenchmark` for compliance.** Neither `minimumSetSize === 0` nor `minimumSetClosesGap` is that fact — see the outlier section above for why an empty set no longer implies a compliant gap. What the size genuinely cannot tell you is _why_ the walk stopped: reaching the benchmark, exhausting the pool, and declining every candidate as an overshoot all produce sets that look alike.

  ⚠️ **The meaning of `closesGap: false` inverted with the two-directional set.** It used to mean the walk ran out of people to lift, the rest of the gap sitting with an advantaged group it could not reach. It now means the opposite problem: correcting the carriers OVERSHOOTS, carrying óskýrt past the benchmark in the other direction, so no prefix of the ordered pool lands inside it. Exhausting the pool lands at `−N − Δβ·(x̄_M − x̄_W)` where `N` is the offsetting mass, not at zero. Read `oskyrtDirectionAfterMinimumSet` for which way the residual gap runs — `oskyrtLogAfterMinimumSet` is a magnitude and cannot say.

  It remains a normal category of report rather than an error state, and it is not rare at small cohort sizes with wide pay dispersion.

Missing cohorts are represented as `null` in the relevant nested metrics, not `0`.

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

| Column              | Type                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                | `uuid` PK                                                                                                                             |
| `report_id`         | `fk → report`                                                                                                                         |
| `event_type`        | `ReportEventTypeEnum`                                                                                                                 |
| `actor_user_id`     | `fk → doe_user` (nullable — null for company admin, cron, or system)                                                                  |
| `report_status`     | `ReportStatusEnum` (snapshot at insert; `= to_status` on `STATUS_CHANGED`)                                                            |
| `from_status`       | `ReportStatusEnum` (nullable — set on `STATUS_CHANGED`)                                                                               |
| `to_status`         | `ReportStatusEnum` (nullable — set on `STATUS_CHANGED`)                                                                               |
| `assigned_user_id`  | `fk → doe_user` (nullable — set on `ASSIGNED`)                                                                                        |
| `reason`            | `text` (nullable — set on `STATUS_CHANGED` → `DENIED`; carries the denial reason)                                                     |
| `related_report_id` | `fk → report` (nullable — set on `SUPERSEDED`; points to the newly approved report that triggered supersession)                       |
| `company_id`        | `fk → company` (nullable — set on `SUBMITTED`; identifies the submitting company for audit purposes)                                  |
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

| Column         | Type                                                          |
| -------------- | ------------------------------------------------------------- |
| `job_key`      | `integer` PK (job-type id from `DOE_TASK_JOB_IDS`)            |
| `last_run_at`  | `timestamptz` (when the job last ran)                         |
| `container_id` | `text` (nullable — container/pod that ran the job, for debug) |

No FKs, no relationships. Standalone bookkeeping table.

## Relationships (summary)

- `company` ⟷ `report` via `company_report` (per-submission snapshot, with optional parent company).
- `report` 1:N `report_criterion` 1:N `report_sub_criterion` 1:N `report_sub_criterion_step`.
- `report` 1:N `report_employee` N:1 `report_employee_role`.
- `report_employee` 1:N `report_employee_outlier` N:1 `report_outlier_group`; `report` 1:N `report_outlier_group` (the group owns the shared explanation/signature fields).
- `report_employee_role` ⟷ `report_sub_criterion_step` via `report_employee_role_criterion_step`.
- `report_employee` ⟷ `report_sub_criterion_step` via `report_employee_personal_criterion_step`.
- `report` 1:1 `report_result`.
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
