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
| `salary:submit` | the workbook presign/import, the analysis preview, and the salary submission |
| `equality:submit` | the equality submission |

A key issued without an explicit scope set gets all three. A call outside the
key's scopes is `403`, and the scope check runs *before* the rate limiter, so a
refused call does not spend your allowance.

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
  a network-level retry is safe. Generate it once, persist it, reuse it on
  retry — do not mint a fresh UUID per attempt.
- It is namespaced server-side as `<companyNationalId>:<yourProviderId>` from
  the authenticated key, so you cannot collide with another employer, and you
  always quote your own bare id — never the stored form.

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
| `status` | `ACTIVE` / `INACTIVE` — whether the company is in the authoritative register at all |
| `salaryReportRequired` | whether a salary report is owed |
| `reportStatus` | what is still outstanding: `MISSING_EQUALITY_REPORT`, `MISSING_SALARY_REPORT`, `MISSING_ACTION_PLAN`, `SATISFACTORY`. Reflects reports filed on any channel, not just this one |
| `nextEqualityReportDueAt`, `nextSalaryReportDueAt` | deadlines. The salary renewal window opens six months before its date |
| `equalityReportOverdue`, `salaryReportOverdue` | derived server-side, so they don't depend on your clock |

Not returned, and not coming: internal row ids, the Directorate's fines and
quarantine flags, admin override flags, and RSK legal-form bookkeeping.

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

*Scope: `equality:submit` → `201 { reportId }`*

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

Twelve steps, of which the outlier handling is the part integrations get wrong.
The order matters: several of these calls exist so you learn about a rejection
before you have built a megabyte of payload.

### B1. `GET /partner/company` — confirm the key

*Scope: `report:read`* — as A1.

### B2. `GET /partner/reports/equality/active` — get `equalityReportId`

*Scope: `report:read`*

The `id` in this response is the mandatory `equalityReportId` on the salary
submission. A `404` here means the salary flow cannot start: go and do section A
first, and wait for approval. The submission re-checks this server-side and
answers `404` if the referenced equality report is not `APPROVED` and still
in force — so this is not a formality you can skip.

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
scale, exactly as the workbook uses them: `entries[]` with `criterionType`
(`RESPONSIBILITY` | `STRAIN` | `CONDITION` | `COMPETENCE` | `PERSONAL`),
`parentTitle`, `title`, `description`, `numSteps`, `steps[]`, plus
`generalScale[]`.

Needed only if you build the criteria tree yourself (B8 alternative). Group for
display by `parentTitle`, not by `criterionType` — several distinct Icelandic
labels map to `PERSONAL`.

### B5. `GET /partner/reports/excel/template` — the blank workbook

*Scope: `report:read`* — returns an `.xlsx` stream.

The same file the employer downloads on island.is. Fetch it, prefill it from
payroll, and hand it to the employer to complete — the template deliberately
ships without personal-criterion values, which are the employer's to fill in.

Skip B5–B8 entirely if you construct the payload yourself.

### B6. `POST /partner/reports/excel/presign` — get an upload URL

*Scope: `salary:submit`* — no body.

Returns `{ url, key }`. The workbook goes to storage **directly**, not through
this API, which is what keeps a multi-megabyte upload off the request path. The
`url` expires in one hour.

### B7. `PUT <url>` — upload the workbook

Not a route on this API. Plain `PUT` of the `.xlsx` bytes to the presigned
`url`. Do not send the `Authorization` header on this request.

### B8. `POST /partner/reports/excel/import` — parse it

*Scope: `salary:submit`*

Body: `{ "key": "<the key from B6>" }`. Returns `ParsedReportDto`:

- `criteria[]` — the criteria tree: type, title, description, weight, and
  `subCriteria[]` each with their `steps[]` (order, description, score).
- `roles[]` — each role title plus its `stepAssignments[]`.
- `employees[]` — one row per employee: `ordinal`, pseudonymous `identifier`,
  `roleTitle`, `gender`, `field`, `department`, `startDate`, `paidHours`,
  `baseSalary`, the viðbótarlaun/aukagreiðslur components, and
  `personalStepAssignments[]`.

**Parse only — nothing is stored.** You get the payload back, inspect it, and
decide whether to submit. The uploaded file is cleaned up afterwards, so a
second import needs a fresh presign.

Two things about `employees[].ordinal`: it is the identity every later step
uses — the analysis returns ordinals, the outlier groups reference ordinals —
and `identifier` (`ABC-001`) is **not** stable across imports, so never key
your own records on it.

The alternative to B5–B8 is to build `ParsedReportDto` directly from payroll
data, using B4 for the criteria and step scale. The submission accepts either;
set `importedFromExcel` on the submission to say which you did.

### B9. `POST /partner/reports/salary-analysis` — find the outliers first

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

### B10. Build the outlier groups

Not a call — the modelling step between B9 and B11.

Partition the `employeeOrdinal`s from B9 into one or more groups. Each group is
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
B9 and B11 can reshuffle who is in it.** If the payload changes, re-run B9 and
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

### B11. `POST /partner/reports/salary` — file it

*Scope: `salary:submit` → `201 { reportId }`*

Body (`SubmitSalaryReportDto`) — beyond the admin/contact/`company`/
`subsidiaries` fields, which are identical to A3 (but with the three average
employee counts **required** here):

| Field | Notes |
| --- | --- |
| `equalityReportId` | the `id` from B2. Re-verified as `APPROVED` and in force → `404` if not |
| `providerId` | your UUID — see the section above |
| `importedFromExcel` | whether `parsed` came from a workbook |
| `salaryDataBasis` | `MONTH` (one specific payroll month) or `AVERAGE` (a twelve-month average). The employer must declare one |
| `salaryDataPeriod` | required when `MONTH`: ISO `YYYY-MM-DD`, any day in the month, normalised to the 1st. Must be a month that has already happened and no earlier than 36 months ago. Ignored for `AVERAGE` |
| `averageEmployeeMaleCount` / `...FemaleCount` / `...NeutralCount` | required |
| `parsed` | the `ParsedReportDto` from B8 (or your own) |
| `outlierGroups?` | the partition from B10 |
| `outliersPostponed?` | defaults to `false`. `true` defers every explanation |

Resulting status: `SUBMITTED` when explanations were supplied (it lands in the
reviewer queue), `POSTPONED` when deferred (a reviewer cannot pick it up).

Same sibling policy as A3: a prior `SUBMITTED` salary report is silently
withdrawn and replaced; a prior `IN_REVIEW` **or `POSTPONED`** one gives `409`.

`503` means the write collided and should be retried with the same
`providerId` — it does not mean the payload was wrong.

### B12. `GET /partner/reports/:providerId` — track the review

*Scope: `report:read`*

As A4, plus the salary-only fields: `salaryDataBasis`, `salaryDataPeriod`,
`outliersPostponed`, `includesImprovementPlan` (true when the report has at
least one outlier), and `result` — the frozen `ReportResultDto` snapshot the
decision rests on.

### B13. `GET /partner/reports/:providerId/outliers` — the filed outlier list

*Scope: `report:read`*

Paginated (`?page=&pageSize=`), returning `{ outliers[], paging }`. Separate
from the report detail because a large employer's list runs to hundreds of
rows.

Use it to show the employer what was actually filed and how each row was
explained. If all you need is "are there any", read `includesImprovementPlan`
from B12 instead of paginating.

---

## Quick reference

| # | Method | Path | Scope |
| --- | --- | --- | --- |
| 1 | `GET` | `/partner/company` | `report:read` |
| 2 | `GET` | `/partner/reports/equality/active` | `report:read` |
| 3 | `GET` | `/partner/reports/salary/eligibility` | `report:read` |
| 4 | `GET` | `/partner/sub-criteria/catalog` | `report:read` |
| 5 | `GET` | `/partner/reports/excel/template` | `report:read` |
| 6 | `POST` | `/partner/reports/excel/presign` | `salary:submit` |
| 7 | `POST` | `/partner/reports/excel/import` | `salary:submit` |
| 8 | `POST` | `/partner/reports/salary-analysis` | `salary:submit` |
| 9 | `POST` | `/partner/reports/salary` | `salary:submit` |
| 10 | `POST` | `/partner/reports/equality` | `equality:submit` |
| 11 | `GET` | `/partner/reports/:providerId` | `report:read` |
| 12 | `GET` | `/partner/reports/:providerId/outliers` | `report:read` |

## Status codes

| Code | Meaning |
| --- | --- |
| `400` | validation — unknown/misspelled field, bad outlier partition, bad `remedyDate`, non-UUID `providerId` |
| `401` | missing or invalid key |
| `403` | key lacks the scope the route declares |
| `404` | no approved equality report; unknown `providerId`; report filed on another channel |
| `409` | renewal window not open; a sibling report is `IN_REVIEW` or `POSTPONED` |
| `429` | rate limit — per key (headers) or per IP |
| `503` | write collision. Retry with the same `providerId` |
