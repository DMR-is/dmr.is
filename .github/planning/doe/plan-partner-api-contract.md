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
detection moves *into* the submit rather than sitting in front of it.

**`POSTPONED` currently has no exit on this channel.** The only resolution route
is `PUT /application/reports/:providerId/outliers` on the island.is surface, and
the status then blocks the company's next submission. We offer an option that
strands whoever takes it.

---

## Phase 1 — Contract narrowing (no migration)

Low risk, no schema change. Ships independently of everything below.

| # | Change | Files |
|---|---|---|
| 1.1 | ✅ `providerId` accepts any non-empty string ≤256 instead of a UUID | `application/dto/submit-salary-report.dto.ts`, `submit-equality-report.dto.ts`, `dto/provider-id.spec.ts`, `docs/partner-api-guide.md` |
| 1.2 | Remove `GET /partner/reports/equality/active` | `partner/partner.controller.ts`, guide §A2/§B2 |
| 1.3 | Reject `salaryDataPeriod` when `salaryDataBasis` is `AVERAGE` (currently ignored silently) | `application/dto/submit-salary-report.dto.ts` |
| 1.4 | Move `GET /partner/sub-criteria/catalog` to the scoring-model group | `partner/partner.controller.ts` → `scoring-model/scoring-model.controller.ts`, guide §C |
| 1.5 | Equality gets its own DTO via `OmitType`, dropping `equalityReportPdf` / `equalityReportPdfFilename` | new `application/dto/submit-partner-equality-report.dto.ts` |
| 1.6 | Fix stale guide text: §A4 tells callers to carry an `equalityReportId` the contract removed in #1483; the catalog's description still says a submission carries a criteria tree | `docs/partner-api-guide.md`, catalog `@PartnerResponse` description |

| 1.7 | Drop `company.nationalId` from the submission body | `application/dto/submit-report-company.dto.ts`, `application.service.ts` (the equality check at :915 goes with it), guide §A3/§B7 |

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

## Phase 3 — Outliers detected at submit

The core change. **No migration** — decided 21 Sept that a submission with
unexplained outliers goes straight to `POSTPONED`, so no new status is needed.

```
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
lands `POSTPONED`, and *then* finds a payroll error cannot re-submit corrected
data. Their only route out is `PUT …/outliers` — explaining outliers in a payload
they already know is wrong — after which the report is `SUBMITTED` and a
corrected filing silently withdraws and replaces it.

Rejected alternatives: making `POSTPONED` replaceable, which changes behaviour on
the channel employers already use and is a coordinated change rather than a
drive-by; and making it replaceable only for `provider_type = OTHER`, which is
the one-policy-two-meanings divergence this codebase keeps getting caught by.

If the support load proves real, the right fix is a `DELETE` or withdraw route on
a `POSTPONED` report this channel filed — not a branch in the sibling policy.

## Phase 4 — The playground

`POST /partner/reports/salary-analysis` → `POST /partner/playground/salary-analysis`.

A sandbox for a vendor, or a vendor's user, to define criteria and employees and
see what the API makes of them. Nothing stored, nothing filed.

- **Takes an inline criteria tree**, not a `scoringModelId` — you cannot
  experiment with criteria you must persist first. This is the `ParsedReportDto`
  shape #1508 removed from the submission; the shape is not dead, this is what it
  is for.
- **`payDispersion` moves here.** It asks nothing — no group, no reason, no
  action, no signature — and on a filing route it needed a paragraph of guide
  prose telling integrators not to act on it. In a playground that is simply what
  a playground is for.
- Own scope and own throttle. Label it unmistakably or somebody will build a
  production flow on it.

**Blocked on a decision:** its scope — `report:read`, one of its own, or none
beyond a valid credential.

---

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
- [ ] `salaryDataPeriod` rejected on `AVERAGE`, accepted and normalised on `MONTH`
- [ ] `company.nationalId` in the body → rejected by the strict whitelist
- [ ] `equalityReportContent` on the partner equality route → rejected; still
      accepted on island.is
- [ ] Multipart submit: valid `.docx`, `.pdf` refused, `.doc` refused, oversized
      refused, missing part refused, malformed zip refused
- [ ] Conversion output asserted on a real plan fixture, not a synthetic one
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
- [ ] Replay semantics unchanged: same `providerId` → `200` with
      `replayed: true`, nothing filed
- [ ] Playground stores nothing and is reachable without submit scopes (per the
      scope decision)
- [ ] `clientConfig.json` regenerated if any admin-visible shape changed

## Status Tracking

| Phase | Item | PR | Status |
|---|---|---|---|
| 1 | `providerId` format | — | **Done**, `d1956e86f` |
| 1 | Remove `equality/active` | — | Pending |
| 1 | Reject `salaryDataPeriod` on `AVERAGE` | — | Pending |
| 1 | Move the catalog route | — | Pending |
| 1 | Partner equality DTO via `OmitType` | — | Pending |
| 1 | Stale guide text | — | Pending |
| 1 | Drop `company.nationalId` | — | Pending |
| 2 | Multipart + mammoth, document-only | — | Pending |
| 3 | Detection at submit → `POSTPONED` | — | Pending |
| 3 | `PUT …/outliers` | — | Pending |
| 4 | Playground | — | Blocked — scope decision |

## Needs Jafnréttisstofa

- Does a `POSTPONED` report satisfy the filing deadline? Now that it is the
  landing state for any submission with unexplained outliers, this matters more
  rather than less. The precedent says yes — island.is has filed `POSTPONED`
  reports this way all along — but it is worth confirming rather than inferring.
- Does one firm reusing one starfsmat across its whole book create a compliance
  problem? Same harm the *no personal-criterion defaults* judgement guards
  against.

## Related

- Vendor clients and delegation are a separate piece of work and want their own
  plan — see the authentication design.
- `apps/directorate-of-equality-partner-api/docs/partner-api-guide.md` is the
  integrator-facing contract and must move with every phase here.
