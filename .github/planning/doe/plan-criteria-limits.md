# Plan: DOE criteria / sub-criteria capacity limits

## Summary

Stakeholder wants "no limit" on criteria, sub-criteria, roles, and personal
sub-criteria — implemented as generous sanity ceilings backed by a widened
Excel template. Replaces the old layout-bound caps (8 roles, 15 personal subs)
and the silent 40-row truncation with real, explicit limits enforced in the
service-side integrity guard, plus a named-range-driven classification parser
that is no longer tied to hardcoded column letters.

Finalized limits:

| Thing | Old | New |
|---|---|---|
| Steps per sub-criterion | 2–8 | 2–8 (unchanged) |
| Sub-criteria **per criterion** | none | **25** |
| Total sub-criteria per report | 40 (silent trunc) | **200** |
| Top-level criteria | 40 (silent trunc) | **24** (4 job + 20 personal) |
| Roles | 8 (hard) | **100** |
| Personal sub-criteria | 15 (hard) | **100** |
| Employees | ~50k abs | **10000** |

## Phase 0 — Template fix (DONE)

The regenerated `template.xlsx` had three exceljs-fatal defects (found via
inspection, all fixed surgically + `refresh-template-data.js` re-run):

1. **Absolute table-part rel targets** (`/xl/tables/tableN.xml`) → exceljs
   keys tables by the relative `../tables/tableN.xml`, so lookup returned
   `undefined` and `workbook.xlsx.load` threw. **The parser could not load any
   file from this template.** Fixed → relative targets.
2. **Missing `<tableStyleInfo>`** on all 3 tables → exceljs *reads* fine but its
   *writer* dereferences `model.theme` on null; the test harness `writeBuffer()`
   crashed. Fixed → neutral styleInfo added.
3. `template-data.ts` (base64 the runtime/tests actually read) was stale — the
   LLM never regenerated it. Fixed → regenerated from the corrected xlsx.

Verified: full load→write→load round-trip OK; named ranges survive; existing
`workbook.parser.spec.ts` (15 tests) green against the new template.

## Phase 1 — Constants (`workbook.schema.ts`)

- Add cap constants next to `MIN_STEPS`/`MAX_STEPS`:
  `MAX_SUB_CRITERIA_PER_CRITERION=25`, `MAX_CRITERIA=24`,
  `MAX_TOTAL_SUB_CRITERIA=200`, `MAX_ROLES=100`,
  `MAX_PERSONAL_SUB_CRITERIA=100`, `MAX_EMPLOYEES=10000`.
- Add `ROLE_STEP_INPUTS` / `EMP_STEP_INPUTS` to `NAMED_RANGES`.

## Phase 2 — Named-range-driven classification parser (`classifications.parser.ts`)

- Replace hardcoded `ROLE_STEP_COLS` / `EMPLOYEE_STEP_COLS` arrays with a
  helper that reads the step-input band from the named range:
  parse `'Sheet'!$G$7:$GW$106` → `{ firstRow, firstCol, inputColCount }`,
  input column N = `firstCol + 2·N`, capacity = `(lastCol-firstCol)/2 + 1`.
- Missing/malformed named range → explicit error (no silent misparse).
- Overflow check now reports the range-derived capacity.

## Phase 3 — Kill silent truncation (`criteria.parser.ts`)

- Remove `MAX_DATA_ROWS = 40`. Scan to `sheet.rowCount` (capped by an absolute
  sanity bound), same pattern as `employees.parser.ts`. Non-data rows already
  skipped; the count caps now live in the guard and raise explicit errors.

## Phase 4 — Caps in the integrity guard (`employee-scores.ts`)

- In `assertParsedPayloadIntegrity` add explicit `BadRequestException`s for:
  criteria > 24, roles > 100, employees > 10000, sub-criteria > 25 per
  criterion, total subs > 200, personal subs > 100. Runs on **both** the
  import path (`report-create.service`) and the application path
  (`application.service`).

## Phase 5 — Tests

- `workbook.parser.spec.ts`: keep existing; add a case proving > default
  columns parse (e.g. a role in a previously-out-of-range column).
- `employee-scores.spec.ts`: add cap-violation cases (per-criterion sub cap,
  total subs, roles, personal subs, criteria, employees).

## Files

- `apps/directorate-of-equality-api/src/modules/report-excel/workbook.schema.ts`
- `apps/directorate-of-equality-api/src/modules/report-excel/parser/classifications.parser.ts`
- `apps/directorate-of-equality-api/src/modules/report-excel/parser/criteria.parser.ts`
- `apps/directorate-of-equality-api/src/modules/report/lib/employee-scores.ts`
- specs: `workbook.parser.spec.ts`, `employee-scores.spec.ts`
- template (done): `template.xlsx`, `template-data.ts`

## DB changes

None. Limits are validation-only; DB stays intentionally unconstrained.

## Security / privacy

No change to PII handling. Caps reduce DoS surface from adversarial uploads
(bounded row/column scans + explicit rejection over cap).

## Testing checklist

- [x] `workbook.parser.spec.ts` green (incl. new wide-column case) — 16 tests
- [x] `employee-scores.spec.ts` green (incl. new cap cases) — 12 tests
- [x] `semantic.validator.spec.ts` green
- [x] Full `directorate-of-equality-api` unit run green — 432 tests, 33 suites
- [x] lint clean (0 errors; only pre-existing spec warnings remain)

## Status

| Phase | Status |
|---|---|
| 0 Template fix | ✅ done |
| 1 Constants | ✅ done |
| 2 Classification parser | ✅ done |
| 3 Kill truncation | ✅ done |
| 4 Guard caps | ✅ done |
| 5 Tests | ✅ done |
