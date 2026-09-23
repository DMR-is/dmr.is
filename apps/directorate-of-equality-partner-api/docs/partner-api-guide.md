# Partner API — integration guide

How a payroll/HR system submits **equality reports** (jafnréttisáætlun) and
**salary reports** (launagreining) to Jafnréttisstofa on behalf of an employer.
There are two kinds of credential:

- a **company key**, which an employer issues for its own integration and which
  acts for that one company; and
- a **vendor client key**, which an approved intermediary — an accounting firm,
  say — holds for itself and uses for every company that has allowed it to act
  for them. See section D.

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

A **vendor client key** does not come from an employer. Jafnréttisstofa first
approves your organisation as a provider; you then collect your own keys on the
Jafnréttisstofa self-service web, signed in as your organisation — or, until that
web ships, Jafnréttisstofa issues them. See section D, including what is not yet
available.

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
Authorization: Bearer doe_live_<keyId>.<secret>     # company key
Authorization: Bearer doev_live_<keyId>.<secret>    # vendor client key
```

The prefix is part of the key — `doe_` or `doev_` — and says which kind it is.

Nothing else is accepted — not a custom header, not a query parameter. A key in
a query string ends up in access logs and referrers.

The key is server-to-server only. CORS is deliberately not enabled, so there is
no legitimate browser caller: a key cannot be kept secret in one.

### Which company you are acting for

**With a company key**, the company comes from the key and nothing else.
`PartnerCompanyGuard` resolves it from `doe_api_key.company_national_id`; no
route takes a company id, and no payload field can change which employer you
are acting for. Do not send `X-Company-National-Id` with a company key — it is a
`400`, because the key already names its company.

**With a vendor client key**, name the company on every request:

```http
Authorization: Bearer doev_live_<keyId>.<secret>
X-Company-National-Id: 5501234567
```

The key stays the same across all your customers; the header changes per
request. It is accepted only while that company has a live delegation to your
organisation, and the request then acts for that company exactly as its own key
would — same routes, same responses. Missing or malformed header: `400`, naming
the header. No live delegation from that company: `403`. See section D.

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

A vendor client key has two sets that count: your organisation's, set when
Jafnréttisstofa approved it, and each company's, chosen when it granted the
delegation. What you may do for a company is **the intersection**. So one
customer can grant you `scoring:write` while another withholds it, with the same
key.

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

Three allowances, and which one you are spending depends on the route.

- **Per key:** 5 000 requests per hour for a company key, 10 000 for a vendor
  client key, across every route **except the dry run**. A vendor key's
  allowance is one bucket for the key, spent across every company it acts for,
  not one per company. Reported in the unsuffixed `X-RateLimit-*` response
  headers for both kinds. A backstop against a runaway retry loop, not a
  commercial quota.
- **Per key, dry run only:** 500 requests per hour for
  `POST /partner/reports/salary-analysis`, which draws on nothing else.
  Rehearsing a filing as often as an extract changes is what that route is for,
  and it must not be able to use up the allowance you need for _filing_. Because
  it is a separate bucket it reports separate headers, suffixed with its name —
  `X-RateLimit-Limit-perKeyDryRun`, `X-RateLimit-Remaining-perKeyDryRun` and
  `X-RateLimit-Reset-perKeyDryRun` — and the unsuffixed `X-RateLimit-*` set does
  not appear on that route. **If you read `X-RateLimit-Remaining` generically
  for backoff, handle its absence there rather than reading it as unlimited.**
  A per-key `429` on that route carries both `Retry-After-perKeyDryRun` and the
  standard `Retry-After`, with the same value, so a generic retry layer that
  reads `Retry-After` works unchanged.
- **Per IP:** 600 requests per minute, counted before authentication (so failed
  keys count too). No headers, including on its `429` — a caller is not the
  subject of that limit.

All three return `429` when exceeded.

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
  `2026/Q1/042` would file a report you could never fetch. For the same reason
  it may not contain a backslash, and may not be `.` or `..` on its own — a URL
  rewrites all of those before the request is routed. Dots _inside_ an id are
  fine: `2026.Q1.042` is one segment and reads back.
- **Surrounding whitespace is trimmed**, on filing and on reading alike, so an
  id that reaches us as `"042 "` is stored and fetched as `042` rather than
  becoming a second key.
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

Returns the company the request acts for — the one a company key belongs to, or the one named in `X-Company-National-Id` with a vendor client key. No parameters. Use it as the first call
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
  present as text for a reviewer to work with it. Pictures inside a plan that
  also has text are fine — they are simply not carried into what gets filed,
  which is the text.
- **There is a limit on what it expands to, as well as on the file.** A
  document whose content inflates past 4MB is refused without being read
  further. In practice only a document built to be large reaches it — 4MB of
  Word content is several hundred pages of text.
- **We do not keep the file.** What is stored is the converted content, which is
  what the reviewer edits and what the approved PDF is rendered from. Keep your
  own copy of the original if you need one.
- Over the size limit is a **`413`**; anything else wrong with the document is a
  **`400`** whose message says what to send instead.

The `payload` part (`SubmitPartnerEqualityReportDto`):

| Field                                                                                        | Notes                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `providerId`                                                                                 | your own id for this submission, any non-empty string up to 256 chars, no `/` or `\\` — see above                                                                                                                                                                                                |
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
and the submission tells you whether it is accepted. Nothing here reads,
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

### B4. `POST /partner/reports/salary-analysis` — the dry run _(optional)_

_Scope: `salary:submit`_

**You do not have to call this to file.** The submission detects its own
outliers and tells you about them, so this is not a step on the way to
anything — it is a rehearsal. Send a payload, find out whether it validates and
what it would produce, and nothing is stored, reserved or filed.

Two moments it earns its place: while you are building the integration and want
to see the shape of a real answer without touching a customer's filing, and when
an employer's extract has changed and you want to know what it does before
putting it in front of them.

Body: `{ "scoringModelId", "employees" }` — the same pair the submission takes,
so a dry run is the filing minus the filing. Returns:

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

**It answers with the submission's rules, not a copy of them.** The payload is
expanded and validated through the identical calls the submission makes, so a
payload this accepts is one the submission accepts, and one it refuses is
refused there too. That is enforced by a test comparing both verdicts on the
same payloads rather than by the two happening to agree today.

**It has its own rate-limit allowance**, separate from the one filings draw on.
Rehearsing as often as an extract changes is what this route is for, and it
cannot use up the budget you need for submitting.

### B5. Build the outlier groups

Not a call — the modelling step before B6.

**This step is optional, and that is the important change.** Explaining an
outlier means asking the employer _why_ two equally-scored people are paid
differently, which takes days, not milliseconds. You are not expected to hold a
submission open while that happens. File without groups and the report lands
`POSTPONED` — filed, recorded, not yet reviewable — and you send the
explanations later with B9. File with them and it goes straight into the
reviewer queue. Both are one call.

Partition the outlier `employeeOrdinal`s — from B6's response, or from B4 if you
ran it — into one or more groups. Each group is
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

Sending **no** groups is not one of these. That is the postpone: the report is
filed as `POSTPONED` with one default group over every detected outlier, and the
response tells you which ordinals it is waiting on. B9 is how you finish it.

**The detected set is computed from the payload you submit**, in the same call,
so nothing can reshuffle it between finding the outliers and explaining them.
The old warning to re-run the analysis after any edit no longer applies — if you
ran B4 first and then changed the extract, the submission simply detects the new
set and reports it.

### B6. `POST /partner/reports/salary` — file it

_Scope: `salary:submit` → `201 { reportId, replayed: false, status }`, or
`200 { reportId, replayed: true, status }` when the `providerId` was already
used and nothing was filed — see the `providerId` section._

**The payroll crosses the wire once.** Outliers are detected during this call,
so what you send is what is scored, and there is no window in which an edit
between a preview and a submit could reshuffle the set.

Three outcomes, all `201`:

| What you sent                          | `status`    | What it means                                                                                                                  |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| a clean payroll                        | `SUBMITTED` | nothing was flagged; it is in the reviewer queue                                                                               |
| outliers **with** groups covering them | `SUBMITTED` | explained on the spot, in one call                                                                                             |
| outliers **without** groups            | `POSTPONED` | filed, but not reviewable until you explain them — the response carries `unexplainedOutlierOrdinals`, and B9 is how you finish |

`unexplainedOutlierOrdinals` is the complete set, not a page of it, and they are
**your** ordinals — the ones you sent — so they map straight back to your own
rows. Persist them, or recover them later from B8.

**A `POSTPONED` report does not block your next filing.** Send a corrected
report under a new `providerId` and the postponed one is withdrawn and replaced.
That matters because `POSTPONED` is simply what a submission with outliers
becomes here — you should not have to explain figures you already know are wrong
in order to be allowed to replace them. (A report a reviewer has already picked
up is different: that still conflicts. See the status codes.)

Body (`SubmitPartnerSalaryReportDto`) — beyond the admin/contact/`company`/
`subsidiaries` fields, which are identical to A3 (but with the three average
employee counts **required** here):

Three fields are **not** part of this body, and sending any of them is a `400`
under the strict validation above:

- **`equalityReportId`** — resolved server-side to the company's approved,
  in-force equality report (`404` when there is none). There was only ever one
  value the submission would accept, and it is the one the server already
  computes for B2.
- **`importedFromExcel`** — there is no workbook on this API for a payload to
  have come from.
- **`outliersPostponed`** — you no longer declare this. Omitting the groups when
  outliers exist _is_ the postpone, so the flag had nothing left to say, and it
  asked you to predict an answer only detection could give: set it on a clean
  payroll and the filing was refused for postponing nothing.

| Field                                                             | Notes                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `providerId`                                                      | your own id for this submission, any non-empty string up to 256 chars, no `/` or `\\` — see the section above                                                                                                                                                                     |
| `salaryDataBasis`                                                 | `MONTH` (one specific payroll month) or `AVERAGE` (a twelve-month average). The employer must declare one                                                                                                                                                                         |
| `salaryDataPeriod`                                                | required when `MONTH`: ISO `YYYY-MM-DD`, any day in the month, normalised to the 1st. Must be a month that has already happened and no earlier than 36 months ago. **Refused when the basis is `AVERAGE`** — an average covers twelve months, so there is no single month to name |
| `averageEmployeeMaleCount` / `...FemaleCount` / `...NeutralCount` | required                                                                                                                                                                                                                                                                          |
| `scoringModelId`                                                  | the company's stored starfsmat. Must be `VALID`                                                                                                                                                                                                                                   |
| `employees`                                                       | the payroll extract from B3                                                                                                                                                                                                                                                       |
| `outlierGroups?`                                                  | the partition from B5                                                                                                                                                                                                                                                             |

Resulting status: `SUBMITTED` when explanations were supplied (it lands in the
reviewer queue), `POSTPONED` when deferred (a reviewer cannot pick it up).

Two more `409`s live on this route beyond the register check above: the renewal
window being shut, and a previous report still in review. The response says
which.

Sibling policy: a prior `SUBMITTED` salary report is silently withdrawn and
replaced, **and so is a prior `POSTPONED` one you filed through this API** —
that is what lets you correct a payroll error after landing `POSTPONED` without
first explaining figures you know are wrong. A prior `IN_REVIEW` report gives
`409`; so does a `POSTPONED` report the employer filed on island.is, since
deferring there was their deliberate choice and is theirs to finish.

`503` means the write collided and should be retried with the same
`providerId` — it does not mean the payload was wrong.

### B7. `GET /partner/reports/:providerId` — track the review

_Scope: `report:read`_

As A4, plus the salary-only fields: `salaryDataBasis`, `salaryDataPeriod`,
`outliersPostponed` (**derived from the current status**, not a record of
history: it is true only while the report is `POSTPONED`, and reads `false` once
B9 moves it to `SUBMITTED` — do not poll it to confirm your PUT applied, read
`status`), `includesImprovementPlan` (true when
the report has at least one outlier), and `result` — the frozen `ReportResultDto` snapshot the
decision rests on.

### B8. `GET /partner/reports/:providerId/outliers` — the filed outlier list

_Scope: `report:read`_

Paginated (`?page=&pageSize=`), returning `{ outliers[], paging }`. Separate
from the report detail because a large employer's list runs to hundreds of
rows.

Use it to show the employer what was actually filed and how each row was
explained. If all you need is "are there any", read `includesImprovementPlan`
from B7 instead of paginating.

### B9. `PUT /partner/reports/:providerId/outliers` — explain them

_Scope: `salary:submit` → the full report detail, as B7._

The exit from `POSTPONED`, and the reason filing without explanations is safe.
Send the groups once the employer has answered; the report moves to `SUBMITTED`
and enters the reviewer queue.

```json
{
  "groups": [
    {
      "name": "Parental leave",
      "reason": "On parental leave for six months of the reference period",
      "action": "No adjustment; salary frozen for the period",
      "signatureName": "Anna Admin",
      "signatureRole": "Mannauðsstjóri",
      "remedyDate": "2027-01-31",
      "employeeOrdinals": [4, 11]
    }
  ]
}
```

- **All-or-none.** The ordinals across your groups must cover the detected set
  exactly: no extras, none missing, and none in two groups. A partial answer is
  refused rather than half-applied.
- **The detected set does not move under you.** It was frozen when the report
  was filed, so the ordinals from B6 are still the right ones however long the
  employer takes. B8 serves the same set if you no longer hold them.
- Each group needs the complete explanation — `reason`, `action`,
  `signatureName`, `signatureRole` and a `remedyDate` in the future and within
  three years.
- Also accepted while the report is `IN_REVIEW`, which leaves the status alone
  and updates what the reviewer is looking at.
- **Any other status is a `400`**, including `SUBMITTED` — a report that is
  already in the queue has nothing outstanding to explain, so this is a mistake
  about which report you are addressing rather than a conflict to retry. The
  same `400` covers a report that was withdrawn and replaced while your request
  was in flight; read it back with B7 before retrying.

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

## D. Filing for many companies (vendor clients)

For an intermediary — an accounting firm, a payroll bureau — that files for many
employers. One credential for your organisation, and one delegation per company
that allows you to act for it, instead of a key from every customer.

> **Availability.** The API side of this section is live. The Jafnréttisstofa
> self-service web — where your organisation collects its keys and your
> customers grant you permission — is still being built. Until it ships, ask
> Jafnréttisstofa to issue your organisation's key, and note that no customer
> can connect to you yet: every request naming a company is a `403` until that
> web exists.

### Getting set up

1. **Be approved.** Ask Jafnréttisstofa to approve your organisation as a
   provider. This is their decision; there is no route that does it.
2. **Collect your key.** Sign in to the Jafnréttisstofa self-service web as your
   organisation and create a key — or, until that web ships, have Jafnréttisstofa
   issue one. As with company keys, it is shown exactly once and you rotate by
   creating a new one, deploying it, and revoking the old.
3. **Let your customers connect.** Put a "Tengjast Jafnréttisstofu" link in your
   own product that opens the self-service web. The customer signs in through
   island.is as their company, picks your organisation from the list of approved
   providers, and chooses what to allow. Nothing in the link is trusted: the
   company comes from their sign-in, and the provider from the list.
4. **Poll `GET /partner/delegations`** to see who has connected. There is no
   callback — polling is how you notice a new connection, and a withdrawal.

**A key alone authorises nothing.** Until a company delegates to you, every
request that names it is a `403`.

### `GET /partner/delegations`

Vendor client keys only (a company key gets `403`). Needs `report:read`. Takes
no `X-Company-National-Id` — it lists every company that has delegated to you,
and sending the header is a `400`.

```json
{
  "delegations": [
    {
      "id": "…",
      "companyNationalId": "5501234567",
      "companyName": "Fyrirtæki ehf.",
      "scopes": ["report:read", "salary:submit"],
      "grantedAt": "2026-09-23T10:00:00.000Z"
    }
  ]
}
```

Send a delegation's `companyNationalId` as `X-Company-National-Id` to act for
that company. A company that withdraws disappears from the list, and requests
naming it turn into `403` immediately.

### What changes, and what does not

- **Every other route works as documented above**, acting for the company in
  the header. There are no vendor-only versions of the filing routes.
- **`providerId` is per company, not per vendor.** It is namespaced with the
  company's kennitala, so your ids never collide across your customers — but
  within one company you share the namespace with that company's own key and
  any provider it used before you. A reused id is a replay (`200`), not a
  second filing.
- **You see what the company's own key would see**, including reports filed
  under another credential for that company.
- **Filing for yourself.** If your organisation is also an employer, connect it
  to itself on the self-service web like any customer, and send your own
  kennitala in the header. There is no separate path.
- **Starfsmat.** If you offer your customers a scoring-model editor, each company
  authors its own model through it, and needs to have granted you
  `scoring:write`. Your organisation's approval has to include it too.

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
| 7b  | `PUT`  | `/partner/reports/:providerId/outliers` | `salary:submit`   |
| 8   | `GET`  | `/partner/sub-criteria/catalog`         | `report:read`     |
| 9   | `GET`  | `/partner/delegations` ²                | `report:read`     |

¹ `multipart/form-data` — a JSON `payload` part and a `.docx` `document` part.
Every other route on this API takes and returns JSON.

² Vendor client keys only, and the one route that takes no
`X-Company-National-Id` — sending it there is a `400`. Every other route acts for a company: with a vendor
client key, name it in that header.

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

| Code  | Meaning                                                                                                                                                                                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `200` | on a submission: replayed. Nothing was filed, the body was not read, and `reportId` names the earlier report. A corrected re-file needs a new `providerId`                                                                                                                                                   |
| `201` | on a submission: filed — `status` says whether it is `SUBMITTED` or `POSTPONED`                                                                                                                                                                                                                              |
| `400` | validation — unknown/misspelled field, bad outlier partition, bad `remedyDate`, empty or over-long `providerId`; or an equality document that is not a usable `.docx`; `X-Company-National-Id` missing or malformed with a vendor client key, sent with a company key, or sent on `GET /partner/delegations` |
| `401` | missing or invalid key                                                                                                                                                                                                                                                                                       |
| `403` | key lacks the scope the route declares (for a vendor client key: your organisation's scopes intersected with the company's); no live delegation from the company named in `X-Company-National-Id`; a company key on `GET /partner/delegations`                                                               |
| `404` | no approved equality report; unknown `providerId`; report filed on another channel                                                                                                                                                                                                                           |
| `409` | the company is not active in the register (any route); renewal window not open; a sibling report is `IN_REVIEW`. A `POSTPONED` sibling does **not** conflict on this API — it is withdrawn and replaced                                                                                                      |
| `413` | the equality document is past the 10MB limit                                                                                                                                                                                                                                                                 |
| `429` | rate limit — per key (headers) or per IP                                                                                                                                                                                                                                                                     |
| `503` | write collision. Retry with the same `providerId`                                                                                                                                                                                                                                                            |
