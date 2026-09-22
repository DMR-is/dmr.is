# Plan: Partner API Contract Narrowing

## Goal

Shrink what a vendor has to send and understand per call on
`directorate-of-equality-partner-api`, and close two paths that currently strand
a caller. Designed 21 Sept 2026; #1508 and #1515 did the scoring-model half of
this work and this is the rest.

The principle the whole pass follows: **the vendor sends what only the vendor
holds** — except where our own copy is staler than theirs, which is why the
company snapshot and the contact blocks stay.

## Key Findings

**The assumed user changed.** Not a lone employer with developers, but
accounting firms managing 100+ client companies. Several decisions below only
make sense against that.

**`mammoth@1.12.0` is already installed**, pulled in transitively by two
packages. Earlier notes claimed the repo had no `.docx` → HTML capability. It
does; the work is promoting it to a direct dependency, not introducing it.

**The outlier round trip is a human one.** A vendor must ask the employer why
two equally-scored people are paid differently — days, not seconds. Every
design that assumed it could happen inside one request was wrong, which is why
detection moves _into_ the submit rather than sitting in front of it.

**The six-month renewal window is dead code on this channel.**
`application.service.ts:189` wraps the whole gate in
`if (process.env.API_ENV === 'prod')`. `ApplicationService` is shared by both
apps, but `API_ENV` is declared only in `directorate-of-equality-api`'s
`.env.schema`, and `varlock-run.sh` unsets every variable an app's own schema
does not declare — so on the partner API it is always `undefined` and the gate
never runs. `GET /reports/salary/eligibility` therefore returns
`RENEWAL_WINDOW_NOT_OPEN` with an `earliestSubmissionDate` while the submission
accepts the filing anyway. **Decided 21 Sept: the window does apply here.**

**`POSTPONED` currently has no exit on this channel.** The only resolution route
is `PUT /application/reports/:providerId/outliers` on the island.is surface, and
the status then blocks the company's next submission. We offer an option that
strands whoever takes it.

---

## Phase 1 — Contract narrowing (no migration)

Low risk, no schema change. Ships independently of everything below.

| #   | Change                                                                                                                                                                                                                                                               | Files                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | ✅ `providerId` accepts any non-empty string ≤256 instead of a UUID                                                                                                                                                                                                  | `application/dto/submit-salary-report.dto.ts`, `submit-equality-report.dto.ts`, `dto/provider-id.spec.ts`, `docs/partner-api-guide.md` |
| 1.2 | Remove `GET /partner/reports/equality/active`                                                                                                                                                                                                                        | `partner/partner.controller.ts`, guide §A2/§B2                                                                                         |
| 1.3 | Reject `salaryDataPeriod` when `salaryDataBasis` is `AVERAGE` (currently ignored silently)                                                                                                                                                                           | `application/dto/submit-salary-report.dto.ts`                                                                                          |
| 1.4 | ⏸ **Deferred.** Group the catalog with the scoring-model routes — documentation only for now; moving the _route_ needs the catalog data moved out of `ApplicationService` first, because `ScoringModelApiModule` deliberately does not boot `ApplicationCoreModule` | `sub-criterion-catalog/`, then `scoring-model.controller.ts`                                                                           |
| 1.5 | Equality gets its own DTO via `OmitType`, dropping `equalityReportPdf` / `equalityReportPdfFilename`                                                                                                                                                                 | new `application/dto/submit-partner-equality-report.dto.ts`                                                                            |
| 1.6 | Fix stale guide text: §A4 tells callers to carry an `equalityReportId` the contract removed in #1483; the catalog's description still says a submission carries a criteria tree                                                                                      | `docs/partner-api-guide.md`, catalog `@PartnerResponse` description                                                                    |
| 1.7 | Declare `API_ENV` in the partner API's `.env.schema`, so the renewal-window gate fires                                                                                                                                                                               | `apps/directorate-of-equality-partner-api/.env.schema`                                                                                 |
| 1.8 | Drop `company.nationalId` from the submission body                                                                                                                                                                                                                   | `application/dto/submit-report-company.dto.ts`, `application.service.ts` (the equality check at :915 goes with it), guide §A3/§B7      |

**Decided 21 Sept:** `company.nationalId` goes. It is validated to equal the
authenticated company, so it can only ever hold one value. Note this gives up a
cross-check that would have had some value once vendor clients land — a firm
pairing the wrong snapshot with the right `X-Company-National-Id` header would
no longer be caught here. If that turns out to matter, the check belongs in the
delegation guard, not in a field the caller supplies.

## Phase 2 — Equality plan as a document

Replaces the base64 HTML string. One request, not three — presign → `PUT` →
submit is overkill for a Word document, and the "multipart fights the 8 MB cap"
objection was wrong: `json()`/`urlencoded()` do not parse multipart, and the file
limit is multer's, set per route.

- `POST /partner/reports/equality` becomes `multipart/form-data` with two parts:
  a JSON `payload` and a `.docx` `document`. Two parts rather than fifteen so
  nested `company` / `subsidiaries[]` keep their JSON encoding and the existing
  validators are untouched.
- Convert `.docx` → HTML with `mammoth` (promote to a direct dependency).
- **Refuse `.pdf`** — no structure, only positioned glyphs. A clear refusal beats
  mangled output. `.doc` out of scope.
- **Do not store the original.** The reviewer edits and approves the HTML, so the
  approved HTML is the record.

**Calibration before merge:** push five or six real equality plans through
mammoth. Conversion quality is Jafnréttisstofa's workload, not the vendor's.

**Decided 21 Sept:** the document is the only way in **on this channel**.
`equalityReportContent` comes off the partner DTO entirely; island.is keeps it,
because its editor already produces HTML and wrapping that in a `.docx` to send
it back would be absurd. Each channel takes the form its users actually hold, and
neither has two ways to send one thing.

**Status: shipped**, on `feat/doe-equality-document` — the converter in
`a763469c` (12 cases) and the route in `82f8b776`.

> **Hashes in this file are only as durable as the commits they name.** These
> two changed once already when the branch was rebased onto the squashed #1532,
> and every phase 1 hash this file used to cite — five of them — stopped
> resolving for anyone else the moment that PR squash-merged, since those commits
> only ever existed on a branch that no longer exists. They now cite `2057c7b8`,
> the commit on `main`. The check is
> `git merge-base --is-ancestor <hash> origin/main`, not `git cat-file -e`: a
> local object store still holds commits nobody else can see.

What landed, and the two decisions taken while wiring it:

- `POST /partner/reports/equality` is `multipart/form-data` with a JSON
  `payload` part and a `.docx` `document` part. `equalityReportContent` is off
  the partner DTO entirely, so it is a plain `OmitType` again.
- **`JsonPartPipe`** is the part that needed care. A multipart part is a string,
  so the global `ValidationPipe` would have passed any text through and this
  route would have accepted bodies the JSON routes reject — the fourth
  "previews clean, rejected at submit", in the phase whose plan named it as the
  thing not to add. The pipe owns no rules: it parses and delegates to a real
  `ValidationPipe` built from `PARTNER_VALIDATION_OPTIONS`, now shared with
  `bootstrap`. Same options by construction rather than by agreement, and a spec
  pins that an unknown field inside the part is still a `400` naming it.
- **The conversion lives in `PartnerSubmissionService`**, not the shared service.
  `ApplicationService` receives `equalityReportContent` exactly as the portal
  sends it, so nothing downstream can tell the two channels apart.
- Multer's cap is per route from `MAX_EQUALITY_DOCUMENT_BYTES`, with memory
  storage so nothing reaches disk. Content checks stay in the converter, which
  sniffs magic bytes rather than trusting the filename or content type. Oversized
  is a `413` from multer; every other document refusal is a `400` that says what
  to send instead.

Three findings from the #1532 review are settled here rather than patched there,
which is why they were deferred: the `@ApiHTML` base64 transform on a field
documented as plain HTML, a spec pinning that DTO's key set, and `"required"`
never having rejected `""` — all three concerned a field this phase removes.

**Still outstanding on this phase:** the calibration run — five or six real
equality plans through mammoth, to see what the conversion does to documents
Jafnréttisstofa will actually receive. That is a judgement about reviewer
workload, not something a test can answer.

## Phase 3 — Outliers detected at submit

The core change. **No migration** — decided 21 Sept that a submission with
unexplained outliers goes straight to `POSTPONED`, so no new status is needed.

```text
POST /partner/reports/salary            ← payload ONCE
  ├─ no outliers                 → 201  SUBMITTED
  ├─ outliers + groups supplied  → 201  SUBMITTED  (partition validated as today)
  └─ outliers, no groups         → 201  POSTPONED  + the outlier list in the body

then, to complete it
  PUT /partner/reports/:providerId/outliers   → SUBMITTED
```

This makes the partner channel behave like island.is, which already files
`POSTPONED` with one default empty group over every detected outlier. Matching it
is the one-pipeline principle rather than a convenience.

- `POST /partner/reports/salary-analysis` stops being the pre-flight step (phase 4).
- `outliersPostponed` comes off the submit body. Omitting groups when outliers
  exist **is** the postpone, so a flag saying so is redundant — and it disposes of
  its current awkwardness (all-or-none, and a `400` when no outliers were
  detected).
- `PUT …/outliers` is the partner twin of
  `PUT /application/reports/:providerId/outliers`, which is what closes the
  `POSTPONED` dead end. Without it this channel publishes a state nothing can
  leave.
- `GET …/:providerId/outliers` gains a real purpose: recovering the list after
  the submit response is gone. Before outliers were detected at submit, nothing
  needed it.
- The payload crosses the wire **once**, and the "any edit between the analysis
  and the submit reshuffles the detected set" hazard disappears — the outliers
  are computed from the payload the server is already holding.

### An earlier design, rejected

A distinct pending state (`AWAITING_EXPLANATION`) plus an explicit
`POST …/postpone` route, so nothing landed postponed by accident. Dropped: it
needed an enum migration, a reviewer-queue exclusion, compliance changes and its
own reaper, and it diverged from island.is for no gain. `POSTPONED` already means
"filed with unexplained outliers, a reviewer cannot pick it up", which is exactly
this state.

### Database changes

**None.**

### The `409` stays, and it has a cost worth knowing

**Decided 21 Sept:** a prior `POSTPONED` report continues to give `409` on a new
submission, unchanged from today and unchanged on island.is.

The consequence, so nobody is surprised by it in support: a vendor who submits,
lands `POSTPONED`, and _then_ finds a payroll error cannot re-submit corrected
data. Their only route out is `PUT …/outliers` — explaining outliers in a payload
they already know is wrong — after which the report is `SUBMITTED` and a
corrected filing silently withdraws and replaces it.

Rejected alternatives: making `POSTPONED` replaceable, which changes behaviour on
the channel employers already use and is a coordinated change rather than a
drive-by; and making it replaceable only for `provider_type = OTHER`, which is
the one-policy-two-meanings divergence this codebase keeps getting caught by.

If the support load proves real, the right fix is a `DELETE` or withdraw route on
a `POSTPONED` report this channel filed — not a branch in the sibling policy.

## Phase 4 — The playground (a dry run)

`POST /partner/reports/salary-analysis` stops being a mandatory pre-flight step
and becomes an **optional dry run**: send a payload, find out whether it
validates and what outliers it produces, then submit for real.

**Locked exactly like every other route.** Full guard chain, and
`@RequireApiScope(ApiKeyScopeEnum.SALARY_SUBMIT)` — the scope it already carries.
No new scope, no `@PublicRoute`. It inherits `@RequireActiveCompany` from the
controller, which is correct: a company off the register should not be
dry-running filings it cannot make.

**It takes the submission's input, not an inline criteria tree.**
`{ scoringModelId, employees }` — the same pair `POST /reports/salary` takes. A
dry run against a different payload is not a dry run.

An earlier draft had it accept an inline criteria tree so a vendor's users could
experiment with criteria definitions. Dropped: the 16 scoring-model routes
already serve that. The employer authors or adjusts the model through those, and
the dry run tests a filing against it.

**Hard requirement: the dry run must go through the same validation code path as
the submit.** If it can answer "valid" where the submission answers `400`, that
is the fourth occurrence of "previews clean, rejected at submit" in this
codebase. Same rules, not rules that agree today.

- Stores nothing.
- `payDispersion` stays here rather than on a filing route. It asks nothing — no
  group, no reason, no action, no signature — and on a filing route it needed a
  paragraph of guide prose telling integrators not to act on it. In a dry run it
  is simply part of what you are shown.
- Worth its own throttle, since it is now optional and repeatable.

Whether the _path_ changes (`/reports/salary-analysis` → `/playground/…`) is
cosmetic and can follow the guide's section layout.

## Security considerations

- **Phase 3 widens what a `salary:submit` credential can do**: it can now
  complete a `POSTPONED` report after the fact. `PUT …/outliers` must go through
  `PartnerCompanyGuard`, so a vendor cannot resolve another company's report, and
  it must refuse a report that is not `POSTPONED` — a `SUBMITTED` or `IN_REVIEW`
  report is not theirs to rewrite. Tenant-isolation specs on both conditions.
- **Phase 2 accepts an uploaded file on a public, internet-facing surface.** Cap
  the multer file size per route, check the magic bytes rather than trusting the
  filename or content type, and make `.pdf` and `.doc` explicit refusals rather
  than attempted conversions. `mammoth` parses untrusted zip content — bound it.
- The partner API is the **first DoE service on the public ALB**, its WAF has no
  rate-limit rule and its ACL is shared with `doe_web`. Confirm `trust proxy 1`
  yields the real caller IP or the per-IP throttler is one bucket for the whole
  internet.
- `DOE_API_KEY_HMAC_SECRET` is still `required=true` on the partner API while its
  decorator was removed from `directorate-of-equality-api` and never restored
  after `api-key.controller.ts` landed. doe-api boots with no pepper and fails
  only at issuance. Out of scope here but it blocks launch.

## Testing checklist

- [ ] DTO bound specs via `plainToInstance` + `validateSync`, following
      `scoring-dto-bounds.spec.ts`. ✅ done for `providerId`
      (`provider-id.spec.ts`)
- [x] `salaryDataPeriod` rejected on `AVERAGE`, accepted and normalised on `MONTH`
- [x] `company.nationalId` in the body → rejected by the strict whitelist
- [x] `equalityReportContent` **required** on the partner equality route; the
      PDF fields refused there, still accepted on island.is
- [x] `providerId` containing `/` or `\`, or equal to `.` or `..` → rejected, so
      nothing files under a handle `GET …/:providerId` cannot match — and `?`,
      `#`, `%`, a space and `2026.Q1.042` still accepted, so the bound cannot
      drift into a charset allowlist
- [x] A read trims its `providerId`, so a trailing space finds the report the
      submission stored
- [x] Converter: `.pdf`, `.doc`, non-document, non-Word zip, empty document,
      oversized and corrupt archive all refused (`equality-document.spec.ts`)
- [x] Multipart submit: valid `.docx`, `.pdf` refused, `.doc` refused, oversized
      refused, missing part refused, malformed zip refused
- [x] The JSON part validates by the same rules as a JSON body — unknown field
      refused inside the part, and valid JSON that is not an object refused
      rather than validated as an empty one
- [ ] Conversion output asserted on a real plan fixture, not a synthetic one —
      waiting on the calibration documents
- [ ] Submit with no outliers → `SUBMITTED`
- [ ] Submit with outliers and no groups → `POSTPONED`, outlier list in the body
- [ ] Submit with outliers and a correct partition → `SUBMITTED` in one call
- [ ] Every partition failure: non-outlier ordinal, missing outlier, duplicate
      ordinal, empty groups
- [ ] `PUT …/outliers` on a `POSTPONED` report → `SUBMITTED`
- [ ] `PUT …/outliers` on a `SUBMITTED` or `IN_REVIEW` report → refused
- [ ] A second submission while a `POSTPONED` report stands → `409`, and the
      message says which conflict it is
- [ ] Tenant isolation on `PUT …/outliers` — another company's `providerId` is
      indistinguishable from a missing one
- [ ] `outliersPostponed` in the body → rejected by the strict whitelist
- [ ] Renewal window: a submission outside the window → `409` on the partner API
      in a deployed env, and `GET …/eligibility` agrees with it
- [ ] Dry run and submit agree: a payload the dry run calls valid is accepted by
      the submission, and one it refuses is refused there too — the assertion
      that catches the two paths drifting
- [ ] Replay semantics unchanged: same `providerId` → `200` with
      `replayed: true`, nothing filed
- [ ] Playground stores nothing and is reachable without submit scopes (per the
      scope decision)
- [ ] `clientConfig.json` regenerated if any admin-visible shape changed

## Status Tracking

| Phase | Item                                           | PR    | Status                                  |
| ----- | ---------------------------------------------- | ----- | --------------------------------------- |
| 1     | `providerId` format                            | —     | **Done**, `2057c7b8`                    |
| 1     | Remove `equality/active`                       | —     | **Done**, `2057c7b8`                    |
| 1     | Reject `salaryDataPeriod` on `AVERAGE`         | —     | **Done**, `2057c7b8`                    |
| 1     | Move the catalog route                         | —     | **Deferred** — module boundary, see 1.4 |
| 1     | Partner equality DTO via `OmitType`            | —     | **Done**, `2057c7b8`                    |
| 1     | Stale guide text                               | —     | **Done**, `2057c7b8`                    |
| 1     | Declare `API_ENV` on the partner API           | —     | **Done**, `2057c7b8`                    |
| 1     | Drop `company.nationalId`                      | —     | **Done**, `2057c7b8`                    |
| 1     | `/` bound on `providerId`                      | #1532 | **Done**, `2057c7b8`                    |
| 1     | `\`, `.`, `..` and the untrimmed read path     | #1532 | **Done**, `d1dc821a`                    |
| 2     | `.docx` → HTML converter                       | —     | **Done**, `a763469c` (12 cases)         |
| 2     | Multipart route, document-only DTO             | —     | **Done**, `82f8b776`                    |
| 2     | Calibration on real plans                      | —     | Pending — needs real documents          |
| 3     | Detection at submit → `POSTPONED`              | —     | Pending                                 |
| 3     | `PUT …/outliers`                               | —     | Pending                                 |
| 4     | Dry run: scope, input shape, shared validation | —     | Pending                                 |

## Phase 1 outcome

Shipped in `2057c7b8` (#1532, squash-merged). Typecheck, lint and tests
clean across `doe-modules` (78 suites / 1539), the partner API (10 / 82) and
`directorate-of-equality-api` (15 / 179).

Two things the work turned up that the plan had not anticipated:

- **`report-draft-submit.service.ts` carried the same dead parent-kennitala
  check** as `application.service.ts`. The type checker found it; the plan had
  listed only the one call site.
- **1.4 is not a route move.** See above — it needs the catalog data relocated
  first, and `ScoringModelApiModule`'s comment says why that boundary exists.

## The #1532 review, settled

**The `/` bound is written** (`2057c7b8`). The review raised
`reports/:providerId` having no charset bound as _optional_; it was promoted and
committed to in public, because it is a defect this branch introduced rather
than a nice-to-have — `2026/Q1/042` filed and then matched no route, so a vendor
could file a report it could never read back on the only handle this API gives
it. It lives in `@ApiProviderId()` next to the trim that shipped with it, so all
three writers of `report.provider_id` inherit it, and the pattern reaches the
generated client rather than only the guide.

Scoped to `/` alone, as promised: everything else round-trips once encoded, and
the specs pin the acceptances too so the bound cannot later drift into a charset
allowlist — which would re-impose a format for taste, the thing loosening this
field set out to undo.

**The re-review then found the bound was one value short of its own reasoning.**
`\`, `.` and `..` are rewritten by a URL before routing and fail identically;
`d1dc821a` closes them, along with the read path not trimming while the write
path did. Both shipped with phase 2 rather than waiting for a branch of their
own, since phase 1 had already merged.

Outstanding from the re-review, none of it blocking and none of it in phase 3's
path:

- `application-system.service.ts:110` — a comment claiming the DTOs still
  constrain `providerId` to a UUID, which is the stated reason that function
  treats the value as untrusted. The behaviour is right; the comment now
  misleads, and a non-UUID on the island.is channel would make the approve/deny
  callback a logged no-op.
- `provider-id.spec.ts` covers the two base DTOs rather than the partner
  subclasses the API actually binds. Metadata inheritance was verified, so this
  is coverage rather than a bug.
- `application.service.spec.ts:605`/`:858` assert the payload-silent case only;
  the third replacement injects a hostile value and these two should match it.

Three findings were pushed back on with reasons, and one of those —
`CreateDraftReportDto` keeping `@ApiUUID` — stands: one minter, no consumer for
a loosening. The other two were deferred to phase 2 and are settled there by
removing the field they were about.

## Deploy consequence

Declaring `API_ENV` takes the partner API's required-variable count from **12 to
13**. It is `@type=enum(dev, prod) @public @required=forEnv(deployed)`, copied
from the sibling app, and `DMR_RUNTIME` is already declared in the partner
schema so `forEnv` resolves. It must be set in ECS or the service will not boot
once deployed — add it to the pre-launch env checklist.

## Needs Jafnréttisstofa

- Does a `POSTPONED` report satisfy the filing deadline? Now that it is the
  landing state for any submission with unexplained outliers, this matters more
  rather than less. The precedent says yes — island.is has filed `POSTPONED`
  reports this way all along — but it is worth confirming rather than inferring.
- Does one firm reusing one starfsmat across its whole book create a compliance
  problem? Same harm the _no personal-criterion defaults_ judgement guards
  against.

## Branch stack

Flat again. #1532 squash-merged as `2057c7b8` on 22 Sept, and
`feat/doe-equality-document` was rebased straight onto `origin/main` — three
commits, no conflicts. Phase 3 branches off `main` like any other work.

The stacking is worth remembering for the next pair, because it cost a restack
mid-phase: phase 2 originally branched four commits before its
parent's tip, and it edits `partner.controller.ts` and the guide, both of which
phase 1 changed after that point. A stacked branch wants the tip, not the commit
that happened to be current when it was created.

## Context that lives outside this repo

The guidance a fresh session needs is not in `dmr.is` — `.claude` is gitignored
here (`.gitignore:5`) and the tree is symlinked out of the `hxm-claude` repo.
Both halves of that are now committed there rather than living on one machine:

- **The DoE app guide** — `dmr-is/.claude/apps/directorate-of-equality/CLAUDE.md`
  in `hxm-claude` (`1e9abf6`), with the `rules/app-*.md` stub that loads it. It
  hands a session the ports, `dev-init`'s load-bearing seed, the one-pipeline
  principle, the ordered guard chains, the starfsmat rules that read as bugs,
  and the Icelandic vocabulary, without it having to ask.
- **The symlinks that make any of it resolve** — `setup-claude-symlinks.sh`
  (`f163ce9`). It previously assumed `hxm-claude` and `dmr.is` were siblings and
  exited 1 anywhere else, which is why the links had been made by hand. It now
  takes the path, computes relative targets, and covers `agents/` and the
  per-app Copilot instructions it used to miss.

So a fresh clone is one script away from the full context. What still does not
travel is this repo's own history: the PR bodies and the commit messages on the
stack carry reasoning this plan does not repeat.

The vault holds the why rather than the state: _Directorate of Equality Partner
API_ and _Directorate of Equality Partner API Authentication_, mirrored to Notion
for colleagues. Useful for judgement calls, not for picking up the code.

## Related

- Vendor clients and delegation are a separate piece of work and want their own
  plan — see the authentication design.
- `apps/directorate-of-equality-partner-api/docs/partner-api-guide.md` is the
  integrator-facing contract and must move with every phase here.
