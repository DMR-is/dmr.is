# Partner API — integration guide

How a payroll/HR system submits **equality reports** (jafnréttisáætlun) and
**salary reports** (launagreining) to Jafnréttisstofa on behalf of an employer,
using an API key the employer issued.

- **Swagger UI:** `https://<partner-api-host>/swagger/partner`
- **OpenAPI JSON:** `https://<partner-api-host>/swagger/partner/json`
- **Locally:** <http://localhost:5300/swagger/partner> — the app serves on port
  `5300` unless `DIRECTORATE_OF_EQUALITY_PARTNER_API_PORT` says otherwise.

Every path below is relative to `https://<partner-api-host>/api/v1`.

---

## 0. Before the first call

### Where the key comes from

**Not from this API.** The partner API only verifies a presented key — it has no
route that issues, lists, rotates or revokes one. Getting a key is an
out-of-band onboarding step, done on the internal DoE API by one of:

- **the employer themselves**, self-service through island.is, which mints a key
  scoped to their own company; or
- **Jafnréttisstofa**, on the employer's behalf, from the *Aðgangslyklar* tab on
  the company view.

Practical consequences for an integration:

- The plaintext secret is shown **exactly once**, at issuance. Only a hash is
  stored, so a key that is lost cannot be recovered — only replaced. Capture it
  into your secret store on receipt.
- **Rotation is additive.** A company may hold several live keys at once, so the
  employer issues a new one, you switch over, and the old one is then revoked —
  no downtime window.
- Revocation is immediate and is the employer's lever, not yours. A revoked or
  expired key answers `401` on every route here, with no distinction as to why.

### Authentication

The key travels as a bearer token, verbatim:

```http
Authorization: Bearer doe_live_<keyId>.<secret>
```

Nothing else is accepted — not a custom header, not a query parameter. A key in
a query string ends up in access logs and referrers.

The key is server-to-server only. CORS is deliberately not enabled, so there is
no legitimate browser caller: a key cannot be kept secret in one.

### The company is never in the request

`PartnerCompanyGuard` resolves the company from the key
(`doe_api_key.company_national_id`). No route takes a company id, and no payload
field can change which employer you are acting for. One key = one employer;
acting for ten customers means ten keys.

### Scopes

A key carries some subset of:

| Scope | Grants |
| --- | --- |
| `report:read` | every `GET` below |
| `salary:submit` | the analysis preview and the salary submission |
| `equality:submit` | the equality submission |

A key issued without an explicit scope set gets all three. A call outside the
key's scopes is `403`, and the scope check runs *before* the rate limiter, so a
refused call does not spend your allowance.

### A company off the register

A company that is not active in Jafnréttisstofa's register **cannot use this
API at all**. Every route answers `409` with a message saying so — reads
included, not just the submissions.

Nothing an integrator can do resolves it: the company itself has to contact
Jafnréttisstofa and have its registration reinstated. So it is not a condition
to retry around, and it is worth surfacing to the employer verbatim rather than
swallowing as a failed sync.

A `409` on the very first call is the signal to look for: the key is valid (an
invalid one answers `401`), the company simply cannot file.

### Rate limits

- **Per key:** 5 000 requests per hour, across the whole surface. Reported in
  the `X-RateLimit-*` response headers. It is a backstop against a runaway
  retry loop, not a commercial quota.
- **Per IP:** 600 requests per minute, counted before authentication (so failed
  keys count too). No headers — the per-key bucket owns the published contract.

Both return `429` when exceeded.

### Request/response conventions

- Request bodies cap at **8 MB**. A large employer's salary payload runs to
  megabytes, which is why it is this high.
- Validation is strict: **an unknown or misspelled field is a `400`**, not
  silently dropped. This is deliberate — silence would let a typo omit a value
  from a filed report.
- Errors come back as `ApiErrorDto` (`400`, `401`, `403`, `404`, `500`, plus
  `409` on the conflicts noted below).

### `providerId` — read this before you build anything

Both submissions require a `providerId`: **your own** identifier for the
submission. Rules that matter:

- It **must be a UUID.** The field is UUID-validated; an id like
  `2026-Q1-042` is rejected with `400`.
- It is **required**, not optional, and it is the only handle you get for
  reading a report back — `GET /partner/reports/:providerId`. The `reportId`
  returned on submit is a DoE-internal id and is not a lookup key on this
  surface.
- It is **your idempotency key.** Re-sending the same `providerId` for the same
  company returns the original `reportId` instead of filing a second report, so
  a network-level retry is safe. Persist it with the submission and reuse it for
  every retry of *that* submission — do not mint a fresh UUID per HTTP attempt.
- **One `providerId` per submission, and a correction is a new submission.**
  This is the distinction that costs data if you get it wrong, so it has its own
  section below.
- It is namespaced server-side as `<companyNationalId>:<yourProviderId>` from
  the authenticated key, so you cannot collide with another employer, and you
  always quote your own bare id — never the stored form.

#### ⚠️ Re-filing a corrected report needs a NEW `providerId`

The employer files, spots a mistake, and you re-file the fixed report. If you
send it under the **same** `providerId`, the call is treated as a retry of the
first submission: **nothing is filed and your corrected payload is not read at
all** — not validated, not compared, not stored. The report the reviewer sees
stays the wrong one.

Do not key `providerId` on the report's identity in your own system
("customer X's 2026 salary report"). Key it on the submission: a new id each
time you intend to file something, the same id only when you are retrying a call
whose outcome you do not know.

Filing a correction is supported and works — a previous `SUBMITTED` report is
withdrawn and replaced by the new one. You simply cannot reach it by reusing an
id.

**Two signals tell you which happened**, and you should assert on at least one:

| | Filed | Replayed |
| --- | --- | --- |
| Status | `201 Created` | `200 OK` |
| `replayed` | `false` | `true` |

A `200` on a submission you believed was new means your `providerId` was already
used. Note that a follow-up `GET /partner/reports/:providerId` cannot tell you
this — it returns the earlier report, looking exactly like a successful
correction, so the response to the submission itself is the only place the
distinction appears.

The same applies to the equality submission.

---

## A. Filing an equality report

The equality report is the narrative gender-equality plan. It must be
**approved** by Jafnréttisstofa before any salary report can reference it, so
this flow comes first and has a human review step in the middle of it.

### A1. `GET /partner/company` — confirm the key

*Scope: `report:read`*

Returns the company the key belongs to. No parameters. Use it as the first call
of any integration: it proves the key is live and points at the employer you
expect, before you build a payload for the wrong company.

A deliberately narrow projection (`PartnerCompanyDto`) — the Directorate's own
working state is not part of this contract:

| Field | Why it's here |
| --- | --- |
| `nationalId`, `name` | identity — is this the employer you meant? |
| `address` | prefills the `company` snapshot a submission carries |
| `employeeCountCategory` | `SMALL` 0–24, `MEDIUM` 25–49, `LARGE` 50+, `UNKNOWN`. What the company owes follows from this |
| `salaryReportRequired` | whether a salary report is owed |
| `reportStatus` | what is still outstanding: `MISSING_EQUALITY_REPORT`, `MISSING_SALARY_REPORT`, `MISSING_ACTION_PLAN`, `SATISFACTORY`. Reflects reports filed on any channel, not just this one |
| `nextEqualityReportDueAt`, `nextSalaryReportDueAt` | deadlines. The salary renewal window opens six months before its date |
| `equalityReportOverdue`, `salaryReportOverdue` | derived server-side, so they don't depend on your clock |

Not returned, and not coming: internal row ids, the Directorate's fines and
quarantine flags, admin override flags, and RSK legal-form bookkeeping.

Nor the company's register lifecycle status. It is the Directorate's own
bookkeeping — see **A company off the register** below for what happens when it
lapses.

### A2. `GET /partner/reports/equality/active` — is one already in force?

*Scope: `report:read`*

Returns the company's currently approved, still-valid equality report:
`{ id, identifier, providerId, approvedAt, validUntil }`. `404` means there is
none.

`providerId` is **your own** id for the submission that became this report, with
the server-side namespace stripped — so it correlates the report back to your
records. It is `null` when the report did not arrive through this API (the
employer filed it on island.is, or an admin created it), in which case none of
your submissions produced it and no route here can read it.

Call it before filing: if it returns a report whose `validUntil` is comfortably
in the future, the employer has no equality obligation right now, and what you
actually want is the salary flow (section B). File a new equality report when
there is none, when it is about to expire, or when the plan itself changed.

### A3. `POST /partner/reports/equality` — file it

*Scope: `equality:submit` → `201 { reportId, replayed: false }`, or
`200 { reportId, replayed: true }` on a replay — as on the salary submission.*

Body (`SubmitEqualityReportDto`):

| Field | Notes |
| --- | --- |
| `providerId` | your UUID for this submission — see above |
| `equalityReportContent` | the plan itself, as **plain HTML**. Persisted as-is and rendered into the approved PDF. (A base64 body is still decoded, for the island.is client's benefit, but it is no longer part of this contract — send markup.) |
| `companyAdminName` / `companyAdminTitle?` / `companyAdminEmail` / `companyAdminGender` | the company executive who stands behind the plan. `companyAdminGender` is a `GenderEnum` value |
| `contactName` / `contactTitle?` / `contactEmail` / `contactPhone` | the day-to-day contact (tengiliður) Jafnréttisstofa writes to |
| `averageEmployeeMaleCount?` / `averageEmployeeFemaleCount?` / `averageEmployeeNeutralCount?` | optional and nullable on an equality report (required on a salary one) |
| `company` | the reporting company: `name`, `nationalId`, `address`, `city`, `postcode`, `isatCategory` — a snapshot frozen onto the report, not a lookup |
| `subsidiaries?` | `[{ name, nationalId }]` when the plan covers a group |

The report is created with status `SUBMITTED` and lands in the reviewer queue.

Two conflicts to expect on this route:

- **A prior `SUBMITTED` equality report is silently withdrawn** and replaced by
  this one. That is the "employer changed their mind before anyone looked at
  it" case.
- **`409` if the prior one is `IN_REVIEW`.** A reviewer is mid-workflow on it
  and it cannot be discarded. Resolve that report first.

A `503` means the write collided — retry with the *same* `providerId`.

### A4. `GET /partner/reports/:providerId` — track the review

*Scope: `report:read`*

Poll this with the `providerId` you sent. Only reports filed through **this
channel** are visible — a report the employer filed themselves on island.is is
not readable here (`404`).

What to watch:

- `status`: `SUBMITTED` → `IN_REVIEW` → `APPROVED` or `DENIED` (also
  `WITHDRAWN`, `SUPERSEDED`).
- `approvedAt` / `validUntil`: once `APPROVED`, the report is in force until
  `validUntil`.
- `correctionDeadline`: set when the reviewer wants corrections by a date.
- `externalComments[]`: the reviewer↔employer thread. This is where a request
  for changes actually arrives — surface it to the employer.
- `denialReason`: populated on `DENIED`.

Only when this report is `APPROVED` can the salary flow reference it. Its `id`
(not its `providerId`) is what the salary submission needs.

---

## B. Filing a salary report

Ten steps, of which the outlier handling is the part integrations get wrong.
The order matters: several of these calls exist so you learn about a rejection
before you have built a megabyte of payload.

**There is no spreadsheet anywhere in this flow, by design.** Replacing the
workbook is the reason this API exists: you build the payload from payroll data
and validate it against B6 until it comes back clean. Nothing here reads,
writes, or accepts an `.xlsx` file.

### B1. `GET /partner/company` — confirm the key

*Scope: `report:read`* — as A1.

### B2. `GET /partner/reports/equality/active` — is one in force?

*Scope: `report:read`*

A salary report is always audited against the company's approved equality
report, but **you do not pass its id** — the submission resolves it itself, from
the same lookup this route answers from. So this call is a precondition check,
not a value to carry: a `404` here means the salary flow cannot start, and
section A has to happen first and be approved. The submission answers the same
`404` for the same reason if you skip ahead.

The `id` in the response is the Directorate's own key. It is not a handle you
can look anything up by on this API — use `providerId` for that (see B9).

### B3. `GET /partner/reports/salary/eligibility` — may they file now?

*Scope: `report:read`*

Returns `{ eligible, reason, dueAt, earliestSubmissionDate }`.

`reason` when not eligible:

- `MISSING_EQUALITY_REPORT` — no approved, in-force equality report. Takes
  priority over everything else.
- `RENEWAL_WINDOW_NOT_OPEN` — the current salary report is due more than six
  months out. `earliestSubmissionDate` is when the window opens.

Cheaper than discovering the renewal window from a rejected submission after
building the payload.

### B4. `GET /partner/sub-criteria/catalog` — reference data

*Scope: `report:read`*

Jafnréttisstofa's catalog of sub-criteria (undirviðmið) and the generic step
scale — the authoritative list of what may be scored and on what steps:
`entries[]` with `criterionType`
(`RESPONSIBILITY` | `STRAIN` | `CONDITION` | `COMPETENCE` | `PERSONAL`),
`parentTitle`, `title`, `description`, `numSteps`, `steps[]`, plus
`generalScale[]`.

This is where the criteria tree in B5 comes from, so fetch it before building
anything. Group for display by `parentTitle`, not by `criterionType` — several
distinct Icelandic labels map to `PERSONAL`.

### B5. Build the payload

Not a call — the work. The salary submission carries a `parsed` object
(`ParsedReportDto`) that you construct from payroll data and the B4 catalog:

- `criteria[]` — the criteria tree: type, title, description, weight, and
  `subCriteria[]` each with their `steps[]` (order, description, score).
- `roles[]` — each role title plus its `stepAssignments[]`.
- `employees[]` — one row per employee: `ordinal`, pseudonymous `identifier`,
  `roleTitle`, `gender`, `field`, `department`, `startDate`, `paidHours`,
  `baseSalary`, the viðbótarlaun/aukagreiðslur components, and
  `personalStepAssignments[]`.

⚠️ The **personal criteria** are the employer's judgement, not payroll data —
they carry roughly a tenth of the total weight and no system can derive them.
Collect them from the employer rather than defaulting them, or you are filing a
score they never agreed to.

`employees[].ordinal` is the identity every later step uses — the analysis
returns ordinals, the outlier groups reference ordinals. Assign them once and
keep them stable for the whole submission.

The type is still named `ParsedReportDto` after the island.is workbook parser
that produces the same shape on that surface. Nothing on this API parses
anything; read the name as "the scoring payload".

### B6. `POST /partner/reports/salary-analysis` — find the outliers first

*Scope: `salary:submit`*

Body: `{ "parsed": <ParsedReportDto> }`. Nothing is stored. Returns:

- **`outliers[]` — the lágmarksmengi.** This is the list that matters: each
  entry has `employeeOrdinal`, `gender`, `roleTitle`, `score`,
  `regularHourlyWage`, `expectedHourlyWage`, `deviationPercent`, `payStatus`
  and `contributionShare`. Submission re-runs *this same computation*
  server-side, so these ordinals are exactly the set the submission will
  demand explanations for.
  Membership is a property of the **set**, not of the individual: an employee
  is in it because of the company-wide óskýrður launamunur, not because of
  their own deviation. Render `payStatus` rather than assuming which question
  the employer is being asked about a row.
- `wageGapDecomposition` — the same decomposition frozen onto the report at
  submit, computed over the same rows at the same precision. The leiðréttur
  launamunur previewed here is the figure that gets filed.
- `regularHourlyWageByScoreAll` — the chart series.
- **`payDispersion` — ábendingar. Informational only.** A second instrument
  over the same data answering a different question ("whose pay is far from
  what their starfsmatsstig imply"). It asks nothing: no group, no reason, no
  action, no signature, and it is never submitted. Do not render it beside the
  úrbótaáætlun inputs, do not require it to be filled in. Render rows only for
  `population: ALL_EMPLOYEES`; when `available` is false, show the `blockers`
  reason whatever the population.

Run this before you ask the employer anything. It is how you find out which
employees need an explanation *before* filing rather than after.

### B7. Build the outlier groups

Not a call — the modelling step between B6 and B8.

Partition the `employeeOrdinal`s from B6 into one or more groups. Each group is
one shared explanation (úrbótaáætlun) over the employees in it:

| Field | Notes |
| --- | --- |
| `name?` | your label for the group. Not required to be unique; a default is assigned when omitted |
| `reason` | why the difference exists. Required, non-empty |
| `action` | what the employer will do about it. Required, non-empty |
| `signatureName` | who signs off. Required, non-empty |
| `signatureRole` | their role. Required, non-empty |
| `remedyDate` | `YYYY-MM-DD` the improvements will be complete by. Must be in the **future** and no more than **three years** out — beyond that is a period this report cannot speak for |
| `employeeOrdinals` | the ordinals this group covers. At least one |

The submission validates the partition strictly. The union of every group's
`employeeOrdinals` must match the detected set **exactly**:

- an ordinal that is not a detected outlier → `400` ("references non-outlier
  employee ordinal(s)")
- a detected outlier in no group → `400` ("missing from the outlier groups")
- an ordinal in two groups → `400` ("appears in more than one outlier group")
- detected outliers but `outlierGroups` empty or absent → `400`

Because the set is recomputed at submit time, **any edit to `parsed` between
B6 and B8 can reshuffle who is in it.** If the payload changes, re-run B6 and
re-partition; do not carry groups over.

**The deferral option.** Instead of groups, send `outliersPostponed: true` and
omit `outlierGroups`. The report is filed with status `POSTPONED`, carrying one
default group with an empty explanation over every detected outlier. It is
all-or-none — postponement applies to the whole report, never to individual
rows — and it requires at least one detected outlier (`400` otherwise).

⚠️ **A postponed report cannot be completed through this API.** Resolving the
explanations is `PUT /application/reports/:providerId/outliers`, which exists
only on the island.is surface; the partner API exposes no such route. A
`POSTPONED` report also sits in a status that blocks the employer's next
submission until it is resolved. Unless the employer specifically wants to
defer and finish on island.is themselves, send real groups.

### B8. `POST /partner/reports/salary` — file it

*Scope: `salary:submit` → `201 { reportId, replayed: false }`, or
`200 { reportId, replayed: true }` when the `providerId` was already used and
nothing was filed — see the `providerId` section.*

Body (`SubmitPartnerSalaryReportDto`) — beyond the admin/contact/`company`/
`subsidiaries` fields, which are identical to A3 (but with the three average
employee counts **required** here):

Two fields are **not** part of this body, and sending either is a `400` under
the strict validation above:

- **`equalityReportId`** — resolved server-side to the company's approved,
  in-force equality report (`404` when there is none). There was only ever one
  value the submission would accept, and it is the one the server already
  computes for B2 and B3.
- **`importedFromExcel`** — there is no workbook on this API for a payload to
  have come from.

| Field | Notes |
| --- | --- |
| `providerId` | your UUID — see the section above |
| `salaryDataBasis` | `MONTH` (one specific payroll month) or `AVERAGE` (a twelve-month average). The employer must declare one |
| `salaryDataPeriod` | required when `MONTH`: ISO `YYYY-MM-DD`, any day in the month, normalised to the 1st. Must be a month that has already happened and no earlier than 36 months ago. Ignored for `AVERAGE` |
| `averageEmployeeMaleCount` / `...FemaleCount` / `...NeutralCount` | required |
| `parsed` | the payload from B5, as validated by B6 |
| `outlierGroups?` | the partition from B7 |
| `outliersPostponed?` | defaults to `false`. `true` defers every explanation |

Resulting status: `SUBMITTED` when explanations were supplied (it lands in the
reviewer queue), `POSTPONED` when deferred (a reviewer cannot pick it up).

Two more `409`s live on this route beyond the register check above: the renewal
window being shut, and a previous report still in review. The response says
which.

Same sibling policy as A3: a prior `SUBMITTED` salary report is silently
withdrawn and replaced; a prior `IN_REVIEW` **or `POSTPONED`** one gives `409`.

`503` means the write collided and should be retried with the same
`providerId` — it does not mean the payload was wrong.

### B9. `GET /partner/reports/:providerId` — track the review

*Scope: `report:read`*

As A4, plus the salary-only fields: `salaryDataBasis`, `salaryDataPeriod`,
`outliersPostponed`, `includesImprovementPlan` (true when the report has at
least one outlier), and `result` — the frozen `ReportResultDto` snapshot the
decision rests on.

### B10. `GET /partner/reports/:providerId/outliers` — the filed outlier list

*Scope: `report:read`*

Paginated (`?page=&pageSize=`), returning `{ outliers[], paging }`. Separate
from the report detail because a large employer's list runs to hundreds of
rows.

Use it to show the employer what was actually filed and how each row was
explained. If all you need is "are there any", read `includesImprovementPlan`
from B9 instead of paginating.

---

## Quick reference

| # | Method | Path | Scope |
| --- | --- | --- | --- |
| 1 | `GET` | `/partner/company` | `report:read` |
| 2 | `GET` | `/partner/reports/equality/active` | `report:read` |
| 3 | `GET` | `/partner/reports/salary/eligibility` | `report:read` |
| 4 | `GET` | `/partner/sub-criteria/catalog` | `report:read` |
| 5 | `POST` | `/partner/reports/salary-analysis` | `salary:submit` |
| 6 | `POST` | `/partner/reports/salary` | `salary:submit` |
| 7 | `POST` | `/partner/reports/equality` | `equality:submit` |
| 8 | `GET` | `/partner/reports/:providerId` | `report:read` |
| 9 | `GET` | `/partner/reports/:providerId/outliers` | `report:read` |

## Status codes

| Code | Meaning |
| --- | --- |
| `200` | on a submission: replayed. Nothing was filed, the body was not read, and `reportId` names the earlier report. A corrected re-file needs a new `providerId` |
| `201` | on a submission: filed |
| `400` | validation — unknown/misspelled field, bad outlier partition, bad `remedyDate`, non-UUID `providerId` |
| `401` | missing or invalid key |
| `403` | key lacks the scope the route declares |
| `404` | no approved equality report; unknown `providerId`; report filed on another channel |
| `409` | the company is not active in the register (any route); renewal window not open; a sibling report is `IN_REVIEW` or `POSTPONED` |
| `429` | rate limit — per key (headers) or per IP |
| `503` | write collision. Retry with the same `providerId` |
