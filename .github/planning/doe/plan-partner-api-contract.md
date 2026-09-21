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

**Blocked on a decision:** whether `company.nationalId` stays. It is validated to
equal the authenticated company (`application.service.ts:915`), so it can only
ever hold one value.

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

**Blocked on a decision:** is the document the *only* way to send the plan, or
does `equalityReportContent` survive for island.is only? Leaving both is how two
ways to send one thing come back.

## Phase 3 — Outliers detected at submit

The core change, and the only one needing a migration.

```
POST /partner/reports/salary            ← payload ONCE
  ├─ no outliers                 → 201  SUBMITTED
  ├─ outliers + groups supplied  → 201  SUBMITTED  (partition validated as today)
  └─ outliers, no groups         → 201  <pending>  + the outlier list in the body

then exactly one of
  PUT  /partner/reports/:providerId/outliers   → SUBMITTED
  POST /partner/reports/:providerId/postpone   → POSTPONED   (deliberate act)
```

- `POST /partner/reports/salary-analysis` stops being the pre-flight step (see
  phase 4).
- `outliersPostponed` comes off the submit body. Postponing is an act, not a
  field — which also disposes of its current awkwardness (all-or-none, and a
  `400` when no outliers were detected).
- `PUT …/outliers` is the partner twin of the island.is route, which closes the
  `POSTPONED` dead end.
- `GET …/:providerId/outliers` gains a real purpose: recovering the list after
  the submit response is gone.

**Why not auto-postpone.** A postponed report is the employer's deliberate
choice, and one that landed there by default would let a company believe it had
complied when it had not.

**Why a new status rather than reusing `DRAFT`.** The abandoned-draft reaper acts
on `DRAFT` and would delete a partner submission the vendor was about to resolve.
Avoiding that needs a `provider_type` special case — the one-status-two-meanings
divergence this codebase keeps getting caught by.

The pending state is **a state, not a draft**: one way in, two ways out, nothing
editable. It must not grow a CRUD surface.

### Database changes

- New value on `report_status_enum`. Postgres `ADD VALUE` cannot run inside a
  transaction block with other DDL in older versions — check the pattern used by
  existing enum migrations before writing it.
- The reviewer queue must exclude the new value exactly as it excludes
  `POSTPONED`.
- Compliance/reminder logic must treat a pending report as **not filed**.

**Blocked on decisions:**
1. The status name — `AWAITING_EXPLANATION`, `OUTLIERS_PENDING`, other.
2. Does a pending report block the company's next submission, or is it
   replaceable? Recommendation: **replaceable**, silently withdrawn by a new
   submission the way `SUBMITTED` is — nobody has looked at it, and a vendor may
   prefer to re-submit a corrected payload.
3. What reaps an abandoned pending report. **Not** the draft reaper.

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

- **Phase 3 widens what a `salary:submit` credential can do**: it can now leave a
  report in a pending state and resolve or postpone it later. `PUT …/outliers`
  and `POST …/postpone` must both go through `PartnerCompanyGuard`, so a vendor
  cannot resolve another company's report. Tenant-isolation specs on both.
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
- [ ] Multipart submit: valid `.docx`, `.pdf` refused, `.doc` refused, oversized
      refused, missing part refused, malformed zip refused
- [ ] Conversion output asserted on a real plan fixture, not a synthetic one
- [ ] Submit with no outliers → `SUBMITTED`
- [ ] Submit with outliers and no groups → pending, outlier list in the body
- [ ] Submit with outliers and a correct partition → `SUBMITTED` in one call
- [ ] Every partition failure: non-outlier ordinal, missing outlier, duplicate
      ordinal, empty groups
- [ ] `PUT …/outliers` on a pending report → `SUBMITTED`
- [ ] `PUT …/outliers` on a `SUBMITTED` or `IN_REVIEW` report → refused
- [ ] `POST …/postpone` on a pending report → `POSTPONED`; on a report with no
      outliers → refused
- [ ] Tenant isolation on both new routes — another company's `providerId` is
      indistinguishable from a missing one
- [ ] A pending report is absent from the reviewer queue and does not count as
      filed for compliance
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
| 1 | `company.nationalId` | — | Blocked — decision |
| 2 | Multipart + mammoth | — | Blocked — document-only or HTML too |
| 3 | Status migration | — | Blocked — name, sibling policy, reaper |
| 3 | Detection at submit | — | Pending on the above |
| 3 | `PUT …/outliers`, `POST …/postpone` | — | Pending on the above |
| 4 | Playground | — | Blocked — scope decision |

## Needs Jafnréttisstofa

- Does a `POSTPONED` report satisfy the filing deadline? It no longer affects the
  default path, only the explicit postpone route.
- Does one firm reusing one starfsmat across its whole book create a compliance
  problem? Same harm the *no personal-criterion defaults* judgement guards
  against.

## Related

- Vendor clients and delegation are a separate piece of work and want their own
  plan — see the authentication design.
- `apps/directorate-of-equality-partner-api/docs/partner-api-guide.md` is the
  integrator-facing contract and must move with every phase here.
