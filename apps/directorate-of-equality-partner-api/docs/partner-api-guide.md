# Partner API — integration guide

How a payroll/HR system submits **equality reports** (jafnréttisáætlun) and
**salary reports** (launagreining) to Jafnréttisstofa on behalf of an employer,
using an API key the employer issued.

- **Swagger UI:** `https://<partner-api-host>/swagger/partner`
- **OpenAPI JSON:** `https://<partner-api-host>/swagger/partner/json`
- **Locally:** <http://localhost:5300/swagger/partner> — the app serves on port
  `5300` unless `DIRECTORATE_OF_EQUALITY_PARTNER_API_PORT` says otherwise.

Every path below is relative to `https://<partner-api-host>/api/v1`.

**Read section C first if the employer has no scoring model yet.** A salary
report is filed _against_ one, so a company with none cannot file at all — and
authoring it is the employer's work, not yours.

---

## 0. Before the first call

### Where the key comes from

**Not from this API.** The partner API only verifies a presented key — it has no
route that issues, lists, rotates or revokes one. Getting a key is an
out-of-band onboarding step, done on the internal DoE API by one of:

- **the employer themselves**, self-service through island.is, which mints a key
  scoped to their own company; or
- **Jafnréttisstofa**, on the employer's behalf, from the _Aðgangslyklar_ tab on
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

| Scope             | Grants                                               |
| ----------------- | ---------------------------------------------------- |
| `report:read`     | every `GET` below, including reading a scoring model |
| `salary:submit`   | the analysis preview and the salary submission       |
| `equality:submit` | the equality submission                              |
| `scoring:write`   | authoring a scoring model — section C                |

A key issued without an explicit scope set gets the first three. **`scoring:write`
is never granted by default** and has to be asked for: authoring a starfsmat is a
different act from filing against one, a vendor that only files never needs it,
and it carries a `DELETE` that cascades a whole model away. If you only file,
`report:read` plus a submit scope is the whole set.

A call outside the key's scopes is `403`, and the scope check runs _before_ the
rate limiter, so a refused call does not spend your allowance.

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

- **It is yours to shape.** Any non-empty string up to 256 characters — a
  UUID, `2026-Q1-042`, whatever your system already mints. The format carries
  no meaning to us; we only ever compare it for equality, so you do not need a
  mapping table to file through this API. **One exception: it may not contain
  `/`.** It is a single path segment when you read the report back, so
  `2026/Q1/042` would file a report you could never fetch. Surrounding
  whitespace is trimmed, so `042` and `042` are the same id rather than two.
- It is **required**, not optional, and it is the only handle you get for
  reading a report back — `GET /partner/reports/:providerId`. The `reportId`
  returned on submit is a DoE-internal id and is not a lookup key on this
  surface.
- It is **your idempotency key.** Re-sending the same `providerId` for the same
  company returns the original `reportId` instead of filing a second report, so
  a network-level retry is safe. Persist it with the submission and reuse it for
  every retry of _that_ submission — do not mint a fresh id per HTTP attempt.
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

|            | Filed         | Replayed |
| ---------- | ------------- | -------- |
| Status     | `201 Created` | `200 OK` |
| `replayed` | `false`       | `true`   |

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

_Scope: `report:read`_

Returns the company the key belongs to. No parameters. Use it as the first call
of any integration: it proves the key is live and points at the employer you
expect, before you build a payload for the wrong company.

A deliberately narrow projection (`PartnerCompanyDto`) — the Directorate's own
working state is not part of this contract:

| Field                                              | Why it's here                                                                                                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `nationalId`, `name`                               | identity — is this the employer you meant?                                                                                                                                     |
| `address`                                          | prefills the `company` snapshot a submission carries                                                                                                                           |
| `employeeCountCategory`                            | `SMALL` 0–24, `MEDIUM` 25–49, `LARGE` 50+, `UNKNOWN`. What the company owes follows from this                                                                                  |
| `salaryReportRequired`                             | whether a salary report is owed                                                                                                                                                |
| `reportStatus`                                     | what is still outstanding: `MISSING_EQUALITY_REPORT`, `MISSING_SALARY_REPORT`, `MISSING_ACTION_PLAN`, `SATISFACTORY`. Reflects reports filed on any channel, not just this one |
| `nextEqualityReportDueAt`, `nextSalaryReportDueAt` | deadlines. The salary renewal window opens six months before its date                                                                                                          |
| `equalityReportOverdue`, `salaryReportOverdue`     | derived server-side, so they don't depend on your clock                                                                                                                        |

Not returned, and not coming: internal row ids, the Directorate's fines and
quarantine flags, admin override flags, and RSK legal-form bookkeeping.

Nor the company's register lifecycle status. It is the Directorate's own
bookkeeping — see **A company off the register** below for what happens when it
lapses.

### A2. _(removed)_ `GET /partner/reports/equality/active`

**This route no longer exists.** It returned the company's in-force equality
report, and nothing could be done with the answer: the salary submission
resolves the company's approved equality report server-side and has carried no
`equalityReportId` since the contract narrowed. Its only remaining use was
correlating a `providerId` back to your own records, which did not justify a
route.

To find out whether a company owes an equality report, read `reportStatus`,
`nextEqualityReportDueAt` and `equalityReportOverdue` from **A1** — all derived
server-side, so they do not depend on your clock.

### A3. `POST /partner/reports/equality` — file it

_Scope: `equality:submit` → `201 { reportId, replayed: false }`, or
`200 { reportId, replayed: true }` on a replay — as on the salary submission._

**This is the one route here that is not JSON.** It is `multipart/form-data`
with exactly two parts:

| Part       | What it is                                                                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payload`  | the report fields, as a **JSON object** (`SubmitPartnerEqualityReportDto`, below). Validated exactly as a JSON body elsewhere here: an unknown field is a `400` naming it, not a silent drop |
| `document` | the plan itself, as a **`.docx`**, at most 10MB                                                                                                                                              |

You do not send the plan's text. Send the Word document the employer already
has, and we convert it — because the employer keeps the plan in Word, and
turning it into markup was a job you were never the right party to do.

```bash
curl -X POST https://<host>/api/v1/partner/reports/equality \
  -H "Authorization: Bearer $API_KEY" \
  -F 'payload={"providerId":"2026-Q1-042","companyAdminName":"…"};type=application/json' \
  -F 'document=@jafnrettisaaetlun.docx'
```

**About the document:**

- **`.docx` only.** A `.pdf` is refused with a message telling you to save as
  `.docx`, and a legacy `.doc` with one telling you to re-save it. Neither is
  converted badly — a mangled plan reaches a reviewer looking like the
  employer's own work, which is worse than a clear refusal.
- **The file is checked by its content, not its name.** Renaming a PDF to
  `.docx` does not get it past; nor does the `Content-Type` you declare.
- **A plan whose text is a scan or an image is refused.** The text has to be
  present as text for a reviewer to work with it.
- **We do not keep the file.** What is stored is the converted content, which is
  what the reviewer edits and what the approved PDF is rendered from. Keep your
  own copy of the original if you need one.
- Over the size limit is a **`413`**; anything else wrong with the document is a
  **`400`** whose message says what to send instead.

The `payload` part (`SubmitPartnerEqualityReportDto`):

| Field                                                                                        | Notes                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `providerId`                                                                                 | your own id for this submission, any non-empty string up to 256 chars, no `/` — see above                                                                                                                                                                                                        |
| `companyAdminName` / `companyAdminTitle?` / `companyAdminEmail` / `companyAdminGender`       | the company executive who stands behind the plan. `companyAdminGender` is a `GenderEnum` value                                                                                                                                                                                                   |
| `contactName` / `contactTitle?` / `contactEmail` / `contactPhone`                            | the day-to-day contact (tengiliður) Jafnréttisstofa writes to                                                                                                                                                                                                                                    |
| `averageEmployeeMaleCount?` / `averageEmployeeFemaleCount?` / `averageEmployeeNeutralCount?` | optional and nullable on an equality report (required on a salary one)                                                                                                                                                                                                                           |
| `company`                                                                                    | the reporting company: `name`, `address`, `city`, `postcode`, `isatCategory` — a snapshot frozen onto the report, not a lookup. **No `nationalId`**: it had to equal the company your key belongs to, so the only accepted value was the one we already had. The snapshot takes it from your key |
| `subsidiaries?`                                                                              | `[{ name, nationalId }]` when the plan covers a group                                                                                                                                                                                                                                            |

There is **no content field**. `equalityReportContent` and the two base64 PDF
fields of the island.is contract are all absent here: the document part is the
only way a plan arrives on this channel, so there is exactly one way to send it
and nothing to be exclusive with.

The report is created with status `SUBMITTED` and lands in the reviewer queue.

Two conflicts to expect on this route:

- **A prior `SUBMITTED` equality report is silently withdrawn** and replaced by
  this one. That is the "employer changed their mind before anyone looked at
  it" case.
- **`409` if the prior one is `IN_REVIEW`.** A reviewer is mid-workflow on it
  and it cannot be discarded. Resolve that report first.

A `503` means the write collided — retry with the _same_ `providerId`.

### A4. `GET /partner/reports/:providerId` — track the review

_Scope: `report:read`_

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

Only when this report is `APPROVED` can a salary report be filed against it.
**You do not pass its id** — the salary submission resolves the company's
approved equality report itself, so there is nothing here to carry forward.
Watch for `APPROVED`, then move to section B.

---

## B. Filing a salary report

The order matters: several of these calls exist so you learn about a rejection
before you have built a large payload.

**There is no spreadsheet anywhere in this flow, by design.** Replacing the
workbook is the reason this API exists: you build the payload from payroll data
and validate it against B4 until it comes back clean. Nothing here reads,
writes, or accepts an `.xlsx` file.

### What you send, and what you do not

A filing names a **scoring model** and sends a **payroll extract**. That is all.

The scoring model (_starfsmat_) is the employer's: the criteria, the
sub-criteria, the þrep on each, the weights, and which þrep every job sits at.
It is authored once and reused, so it is **not part of a filing** — you send its
id. A company's model rarely changes between filings, and re-transmitting a
hundred step descriptions and a job-assignment matrix every year served nobody.

What you send per filing is one row per employee: fourteen payroll fields, the id
of the job they hold, and their personal-criterion assessment. Everything but
that last part is data your payroll system already holds.

Section C covers authoring the model. If the employer already has one, you only
need its id — `GET /partner/scoring-models` lists them.

### B1. `GET /partner/company` — confirm the key

_Scope: `report:read`_ — as A1.

### B2. `GET /partner/reports/salary/eligibility` — may they file now?

_Scope: `report:read`_

Returns `{ eligible, reason, dueAt, earliestSubmissionDate }`.

`reason` when not eligible:

- `MISSING_EQUALITY_REPORT` — no approved, in-force equality report. Takes
  priority over everything else.
- `RENEWAL_WINDOW_NOT_OPEN` — the current salary report is due more than six
  months out. `earliestSubmissionDate` is when the window opens.

Cheaper than discovering the renewal window from a rejected submission after
building the payload.

### B3. Build the payroll extract

Not a call — the work, and it is smaller than it used to be. One row per
employee:

- `ordinal` — this employee's identity for the whole submission. The analysis
  returns ordinals and the outlier groups reference them. Assign once, keep
  stable.
- `identifier` — a pseudonymous handle of the employer's own, **never a
  kennitala**. Reviewers see it, so a flagged row can be traced back internally.
- `roleId` — the job they hold, from the scoring model. Not a title: a job that
  is not in the model is a `400`, where a mismatched title used to be a silently
  unmatched row.
- `gender`, `field`, `department`, `startDate`, `paidHours`, `baseSalary`, and
  the viðbótarlaun / aukagreiðslur components.
- `personalSteps[]` — `{ subCriterionId, stepId }` per personal sub-criterion in
  the model.

⚠️ **`personalSteps` is the one part no system can derive.** It is the
employer's assessment, carries roughly a tenth of the total weight, and has to
be collected from them rather than defaulted — a default is a score they never
agreed to. Everything else in the row is payroll data.

`paidHours` is _greiddar stundir í mánuðinum_: fixed overtime counts, incidental
hours do not. It is the denominator of reglulegt tímakaup, so an employee with
unusable hours fails the payload gate rather than scoring oddly.

**You do not send the criteria tree, the þrep, or the job step assignments.**
They live in the scoring model you named, and the server expands them. If a þrep
description or a weight is wrong, fix the _model_ (section C) — not the filing.

### B4. `POST /partner/reports/salary-analysis` — find the outliers first

_Scope: `salary:submit`_

Body: `{ "scoringModelId", "employees" }` — the same pair the submission takes.
Nothing is stored. Returns:

- **`outliers[]` — the lágmarksmengi.** This is the list that matters: each
  entry has `employeeOrdinal`, `gender`, `roleTitle`, `score`,
  `regularHourlyWage`, `expectedHourlyWage`, `deviationPercent`, `payStatus`
  and `contributionShare`. Submission re-runs _this same computation_
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
employees need an explanation _before_ filing rather than after.

### B5. Build the outlier groups

Not a call — the modelling step between B4 and B6.

Partition the `employeeOrdinal`s from B4 into one or more groups. Each group is
one shared explanation (úrbótaáætlun) over the employees in it:

| Field              | Notes                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name?`            | your label for the group. Not required to be unique; a default is assigned when omitted                                                                                  |
| `reason`           | why the difference exists. Required, non-empty                                                                                                                           |
| `action`           | what the employer will do about it. Required, non-empty                                                                                                                  |
| `signatureName`    | who signs off. Required, non-empty                                                                                                                                       |
| `signatureRole`    | their role. Required, non-empty                                                                                                                                          |
| `remedyDate`       | `YYYY-MM-DD` the improvements will be complete by. Must be in the **future** and no more than **three years** out — beyond that is a period this report cannot speak for |
| `employeeOrdinals` | the ordinals this group covers. At least one                                                                                                                             |

The submission validates the partition strictly. The union of every group's
`employeeOrdinals` must match the detected set **exactly**:

- an ordinal that is not a detected outlier → `400` ("references non-outlier
  employee ordinal(s)")
- a detected outlier in no group → `400` ("missing from the outlier groups")
- an ordinal in two groups → `400` ("appears in more than one outlier group")
- detected outliers but `outlierGroups` empty or absent → `400`

Because the set is recomputed at submit time, **any edit to the payroll extract
or the scoring model between
B4 and B6 can reshuffle who is in it.** If the payload changes, re-run B4 and
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

### B6. `POST /partner/reports/salary` — file it

_Scope: `salary:submit` → `201 { reportId, replayed: false }`, or
`200 { reportId, replayed: true }` when the `providerId` was already used and
nothing was filed — see the `providerId` section._

Body (`SubmitPartnerSalaryReportDto`) — beyond the admin/contact/`company`/
`subsidiaries` fields, which are identical to A3 (but with the three average
employee counts **required** here):

Two fields are **not** part of this body, and sending either is a `400` under
the strict validation above:

- **`equalityReportId`** — resolved server-side to the company's approved,
  in-force equality report (`404` when there is none). There was only ever one
  value the submission would accept, and it is the one the server already
  computes for B2.
- **`importedFromExcel`** — there is no workbook on this API for a payload to
  have come from.

| Field                                                             | Notes                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `providerId`                                                      | your own id for this submission, any non-empty string up to 256 chars, no `/` — see the section above                                                                                                                                                                             |
| `salaryDataBasis`                                                 | `MONTH` (one specific payroll month) or `AVERAGE` (a twelve-month average). The employer must declare one                                                                                                                                                                         |
| `salaryDataPeriod`                                                | required when `MONTH`: ISO `YYYY-MM-DD`, any day in the month, normalised to the 1st. Must be a month that has already happened and no earlier than 36 months ago. **Refused when the basis is `AVERAGE`** — an average covers twelve months, so there is no single month to name |
| `averageEmployeeMaleCount` / `...FemaleCount` / `...NeutralCount` | required                                                                                                                                                                                                                                                                          |
| `scoringModelId`                                                  | the model B4 validated against. Must be `VALID`                                                                                                                                                                                                                                   |
| `employees`                                                       | the payroll extract from B3, unchanged since B4                                                                                                                                                                                                                                   |
| `outlierGroups?`                                                  | the partition from B5                                                                                                                                                                                                                                                             |
| `outliersPostponed?`                                              | defaults to `false`. `true` defers every explanation                                                                                                                                                                                                                              |

Resulting status: `SUBMITTED` when explanations were supplied (it lands in the
reviewer queue), `POSTPONED` when deferred (a reviewer cannot pick it up).

Two more `409`s live on this route beyond the register check above: the renewal
window being shut, and a previous report still in review. The response says
which.

Same sibling policy as A3: a prior `SUBMITTED` salary report is silently
withdrawn and replaced; a prior `IN_REVIEW` **or `POSTPONED`** one gives `409`.

`503` means the write collided and should be retried with the same
`providerId` — it does not mean the payload was wrong.

### B7. `GET /partner/reports/:providerId` — track the review

_Scope: `report:read`_

As A4, plus the salary-only fields: `salaryDataBasis`, `salaryDataPeriod`,
`outliersPostponed`, `includesImprovementPlan` (true when the report has at
least one outlier), and `result` — the frozen `ReportResultDto` snapshot the
decision rests on.

### B8. `GET /partner/reports/:providerId/outliers` — the filed outlier list

_Scope: `report:read`_

Paginated (`?page=&pageSize=`), returning `{ outliers[], paging }`. Separate
from the report detail because a large employer's list runs to hundreds of
rows.

Use it to show the employer what was actually filed and how each row was
explained. If all you need is "are there any", read `includesImprovementPlan`
from B7 instead of paginating.

---

## C. The scoring model (starfsmat)

The criteria a salary report is scored against, stored once against the company
and named by a filing. **Authored once, reused every year** — a company's
starfsmat changes when the organisation does, not when it files.

### Whose work this is

Not yours, unless the employer has asked you to do it. Authoring a model is
three jobs and none of them is data entry: choosing which sub-criteria apply,
distributing the weight — a policy decision about how this company values work —
and writing the þrep descriptions for the personal criterion. If the employer
already has a model, `GET /partner/scoring-models` gives you its id and you are
done with this section.

`GET /partner/sub-criteria/catalog` is Jafnréttisstofa's set of **examples**, not
a menu you must pick from: nothing validates a model against it, it carries no
weights, and its personal entries ship with step 1 only. Copy from it freely and
edit whatever you copy.

### The rules a model must satisfy

- At least one criterion of each of the four job-based **types**
  (`RESPONSIBILITY`, `STRAIN`, `CONDITION`, `COMPETENCE`) — the types are
  mandatory, not any particular criteria. Two criteria of one type are fine
  **provided their titles differ**, and a model holds at most 5 criteria in
  total — four mandatory types plus one `PERSONAL` is already the ceiling, so
  splitting one in two means dropping another.
- Criterion titles are unique within a model, and so are job titles. Both are
  how a filing resolves what an employee is scored against.
- At most one `PERSONAL` criterion.
- **Every sub-criterion weight in the model sums to 100.** Not per criterion —
  across the whole model. A criterion's own weight is the sum of its
  sub-criteria's and is returned for display; you never send it.
- Each sub-criterion has between 2 and 8 þrep, numbered 1..n with no gaps. You
  do not send the numbers: position in the array is the þrep.
- Every job carries exactly one þrep per **job-based** sub-criterion. Personal
  sub-criteria are scored per employee (B3), never per job.
- Two sub-criteria may not share both their title and their parent's.

### Writes always succeed; the filing is what refuses

A model is built over many calls and cannot total 100 until the last
sub-criterion lands, so **every write succeeds even when it leaves the model
incomplete** — refusing them would make a model impossible to author. Every
response, reads included, carries:

```json
{
  "validation": {
    "status": "INVALID",
    "reasons": [
      {
        "scope": "SUB_CRITERIA",
        "message": "Vægi undirviðmiða leggst saman í 110%, á að vera 100%"
      }
    ]
  }
}
```

Every reason at once, not the first — one round trip tells you everything
outstanding. The messages are Icelandic and written for the employer who has to
fix them, so you can show them as they are. `scope` says which part of the model
each concerns, so you can attach it to the right thing without parsing the text.

⚠️ **`VALID` means the model is complete, not that your next filing will
succeed.** Two of the submission's rules need the filing's own employees and
cannot be judged here: that the report covers enough of them, and that each one
carries a þrep for every personal sub-criterion.

### Scales and job assignments are written whole

`PUT …/sub-criteria/{id}/steps` and `PUT …/roles/{id}/step-assignments` replace
the whole array rather than editing one entry. A þrep's score derives from its
position over the scale's length, so the numbers must run 1..n — and building
that one call at a time passes through states no single call can repair.

Replacing a scale drops any job assignment onto it. That is deliberate: you are
a program rebuilding the model, and the model will tell you the job is missing an
assignment rather than silently re-pointing it at a þrep you did not choose.

### Deleting

`DELETE /partner/scoring-models/{modelId}` takes its criteria, sub-criteria,
þrep and jobs with it. **Reports already filed against it are unaffected** — a
filing copies the model it was scored under, so the figures on a filed report
never move when the model changes or goes away.

## Quick reference

| #   | Method | Path                                    | Scope             |
| --- | ------ | --------------------------------------- | ----------------- |
| 1   | `GET`  | `/partner/company`                      | `report:read`     |
| 2   | `GET`  | `/partner/reports/salary/eligibility`   | `report:read`     |
| 3   | `POST` | `/partner/reports/salary-analysis`      | `salary:submit`   |
| 4   | `POST` | `/partner/reports/salary`               | `salary:submit`   |
| 5   | `POST` | `/partner/reports/equality` ¹           | `equality:submit` |
| 6   | `GET`  | `/partner/reports/:providerId`          | `report:read`     |
| 7   | `GET`  | `/partner/reports/:providerId/outliers` | `report:read`     |
| 8   | `GET`  | `/partner/sub-criteria/catalog`         | `report:read`     |

¹ `multipart/form-data` — a JSON `payload` part and a `.docx` `document` part.
Every other route on this API takes and returns JSON.

Scoring model (section C):

| Method   | Path                                                       | Scope           |
| -------- | ---------------------------------------------------------- | --------------- |
| `GET`    | `/partner/scoring-models`                                  | `report:read`   |
| `GET`    | `/partner/scoring-models/{modelId}`                        | `report:read`   |
| `POST`   | `/partner/scoring-models`                                  | `scoring:write` |
| `DELETE` | `/partner/scoring-models/{modelId}`                        | `scoring:write` |
| `POST`   | `/partner/scoring-models/{modelId}/criteria`               | `scoring:write` |
| `PATCH`  | `/partner/scoring-models/{modelId}/criteria/{criterionId}` | `scoring:write` |
| `DELETE` | `/partner/scoring-models/{modelId}/criteria/{criterionId}` | `scoring:write` |
| `POST`   | `…/criteria/{criterionId}/sub-criteria`                    | `scoring:write` |
| `PATCH`  | `…/sub-criteria/{subCriterionId}`                          | `scoring:write` |
| `DELETE` | `…/sub-criteria/{subCriterionId}`                          | `scoring:write` |
| `PUT`    | `…/sub-criteria/{subCriterionId}/steps`                    | `scoring:write` |
| `POST`   | `/partner/scoring-models/{modelId}/roles`                  | `scoring:write` |
| `PATCH`  | `…/roles/{roleId}`                                         | `scoring:write` |
| `DELETE` | `…/roles/{roleId}`                                         | `scoring:write` |
| `PUT`    | `…/roles/{roleId}/step-assignments`                        | `scoring:write` |
| `GET`    | `/partner/sub-criteria/catalog`                            | `report:read`   |

## Status codes

| Code  | Meaning                                                                                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `200` | on a submission: replayed. Nothing was filed, the body was not read, and `reportId` names the earlier report. A corrected re-file needs a new `providerId`            |
| `201` | on a submission: filed                                                                                                                                                |
| `400` | validation — unknown/misspelled field, bad outlier partition, bad `remedyDate`, empty or over-long `providerId`; or an equality document that is not a usable `.docx` |
| `401` | missing or invalid key                                                                                                                                                |
| `403` | key lacks the scope the route declares                                                                                                                                |
| `404` | no approved equality report; unknown `providerId`; report filed on another channel                                                                                    |
| `409` | the company is not active in the register (any route); renewal window not open; a sibling report is `IN_REVIEW` or `POSTPONED`                                        |
| `413` | the equality document is past the 10MB limit                                                                                                                          |
| `429` | rate limit — per key (headers) or per IP                                                                                                                              |
| `503` | write collision. Retry with the same `providerId`                                                                                                                     |
