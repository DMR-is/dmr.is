/**
 * Regenerates `db/seeders/data/wage-gap-fixtures.json` — the frozen
 * `wage_gap_decomposition_snapshot` values the seeders write onto
 * `report_result`.
 *
 *     yarn nx run directorate-of-equality-api:refresh-wage-gap-fixtures
 *
 * ── Why a generator rather than hand-written JSON ────────────────────────────
 *
 * `report_result` is write-once-at-submit, so a seeded report needs a snapshot
 * that already exists rather than one computed on read. Hand-writing it would
 * put figures in the database that the seeded employee rows do not imply: the
 * UI would show óskýrt = X% above an employee list that computes to something
 * else, and nothing anywhere would notice. Reimplementing the decomposition in
 * the seeders would be worse — a second copy of the engine, drifting invisibly.
 *
 * So this runs the REAL implementation over the SAME employee data the seeders
 * insert, and commits the output. It also emits `rich-demo-sheet.json`, the
 * adjusted 100-employee cohort, together with its chart — so a seeded report's
 * rows, chart and frozen snapshot all describe one cohort. This replaced
 * `salary-analysis-test-res.json`, a band-era capture that became orphaned.
 *
 * Re-run it whenever the decomposition's output shape changes, or when either
 * cohort below changes, and commit the regenerated JSON.
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

import {
  scenarioEmployees,
  scenarioHourlyWage,
} from '../db/lib/scenario-cohort'
import { getRegularHourlyWage } from '../src/modules/report/lib/compensation-aggregates'
import {
  assertParsedPayloadIntegrity,
  computeEmployeeScores,
} from '../src/modules/report/lib/employee-scores'
import {
  computeWageGapDecomposition,
  roundWageGapDecompositionSnapshot,
  type WageGapDecompositionSnapshot,
  type WageGapEmployeeInput,
} from '../src/modules/report/lib/wage-gap-decomposition'
import { GenderEnum } from '../src/modules/report/models/report.enums'
import type { ParsedReportDto } from '../src/modules/report-excel/dto/parsed-report.dto'
import { buildChartFromEmployeePoints } from '../src/modules/report-statistics/lib/build-chart'

/**
 * **The demo gap.** Every woman's pay in the 100-employee sheet is scaled by
 * `1 − DEMO_PAY_CUT` before anything is computed from it.
 *
 * Why the sheet needs adjusting at all: as captured, it is **compliant** under
 * the rule that replaced the ±band — óskýrt is 2,11% against a 3,9% benchmark,
 * and it runs *í óhag karla*. So the two seeders built to demonstrate the
 * úrbótaáætlun had nothing to demonstrate. The sheet was captured when an
 * individual ±1,95% band decided everything and a company-wide gap decided
 * nothing, which is exactly why it does not exercise the new rule.
 *
 * Why a uniform scale rather than hand-picked rows: it is one sentence to
 * explain, it is reproducible, and it leaves the sheet's job structure, score
 * distribution and role mix untouched — so the only thing that changed is the
 * thing being demonstrated.
 *
 * 10% was chosen from the response curve (each 2 points of cut moves óskýrt
 * ~2 points): it yields **óskýrt 7,84% í óhag kvenna** with a **6-member
 * lágmarksmengi** out of 24 correctable — enough to split across the three
 * groups `seed-doe-three-group-outliers` exists to render, with two each.
 */
const DEMO_PAY_CUT = 0.1

/** The statutory benchmark, matching the seeded `config` row. */
const BENCHMARK_PERCENT = 3.9

const DATA_DIR = join(__dirname, '..', 'db', 'seeders', 'data')

/** Rounded exactly as `report-result.service.ts` rounds before persisting. */
const compute = (
  employees: WageGapEmployeeInput[],
): WageGapDecompositionSnapshot =>
  roundWageGapDecompositionSnapshot(
    computeWageGapDecomposition({
      employees,
      benchmarkPercent: BENCHMARK_PERCENT,
    }),
  )

/** Every pay field on one employee, scaled. Nulls stay null. */
function scalePay(
  employee: ParsedReportDto['employees'][number],
  factor: number,
): ParsedReportDto['employees'][number] {
  // Normalises `undefined` to `null`: the DTO's optional pay fields are
  // `number | null`, and the parsed JSON uses null for "not entered".
  const scale = (v: number | null | undefined): number | null =>
    v === null || v === undefined ? null : Math.round(v * factor)

  return {
    ...employee,
    baseSalary: Math.round(employee.baseSalary * factor),
    additionalFixedOvertime: scale(employee.additionalFixedOvertime),
    additionalFixedCarAllowance: scale(employee.additionalFixedCarAllowance),
    bonusOccasionalCarAllowance: scale(employee.bonusOccasionalCarAllowance),
    bonusOccasionalOvertime: scale(employee.bonusOccasionalOvertime),
    bonusPayments: scale(employee.bonusPayments),
    bonusOther: scale(employee.bonusOther),
  }
}

const hourlyWageOf = (employee: ParsedReportDto['employees'][number]): number =>
  getRegularHourlyWage({
    paidHours: employee.paidHours,
    baseSalary: employee.baseSalary,
    additionalSalary:
      (employee.additionalFixedOvertime ?? 0) +
      (employee.additionalFixedCarAllowance ?? 0),
    bonusSalary:
      (employee.bonusOccasionalCarAllowance ?? 0) +
      (employee.bonusOccasionalOvertime ?? 0) +
      (employee.bonusPayments ?? 0) +
      (employee.bonusOther ?? 0),
  })

/**
 * The 100-employee sheet behind `seed-doe-rich-scenario` and
 * `seed-doe-three-group-outliers`, with {@link DEMO_PAY_CUT} applied. Emits the
 * adjusted payload, its chart and its decomposition together so the seeders
 * insert employee rows, render a chart and freeze a snapshot that all describe
 * the SAME cohort.
 *
 * Scored through the exact submit path — `assertParsedPayloadIntegrity` for the
 * step-score map, then `computeEmployeeScores` — so the scores match the
 * `report_employee.score` values those seeders write, and so this fixture is
 * verified on every run to be a payload the API would actually accept.
 *
 * That gate used to reject the sheet: it carried 7 criteria against
 * `MAX_CRITERIA = 5` and 3 personal against `MAX_PERSONAL_CRITERIA = 1`, both
 * caps postdating the capture. The three PERSONAL criteria were folded into one
 * (2026-08-20) keeping every sub-criterion and step, so scores were provably
 * unchanged — 0 drift across all 100 employees — while the sheet became
 * submittable. Running the real gate here means it cannot silently drift out of
 * validity again.
 */
function richDemoFixture(payCut: number = DEMO_PAY_CUT) {
  const pristine: ParsedReportDto = JSON.parse(
    readFileSync(join(DATA_DIR, 'excel-import-test-res.json'), 'utf8'),
  )

  // ⚠️ The source capture is never mutated — the adjustment is applied here, on
  // every run, so regenerating is idempotent rather than compounding.
  const parsed: ParsedReportDto = {
    ...pristine,
    employees: pristine.employees.map((employee) =>
      employee.gender === GenderEnum.MALE
        ? employee
        : scalePay(employee, 1 - payCut),
    ),
  }

  // Throws if the sheet is not a payload the API would accept — the same 400 a
  // submitter would get. Deliberately run against the ADJUSTED payload, since
  // that is what the seeders insert.
  const stepScoreByKey = assertParsedPayloadIntegrity(parsed)
  const scores = computeEmployeeScores(parsed, stepScoreByKey)
  const withWage = parsed.employees.map((employee, index) => ({
    ordinal: employee.ordinal,
    gender: employee.gender,
    score: scores[index],
    hourlyWage: hourlyWageOf(employee),
  }))

  return {
    payCutPercent: payCut * 100,
    parsed,
    scores,
    // Same builder the live endpoints use, so the seeded chart matches what the
    // API would return for these rows.
    chart: buildChartFromEmployeePoints(
      withWage.map((e) => ({
        score: e.score,
        regularHourlyWage: e.hourlyWage,
        gender: e.gender,
      })),
    ),
    decomposition: compute(withWage),
  }
}

/** The six-employee scenario cohort, in both flavours. */
function scenarioSnapshot(hasOutliers: boolean): WageGapDecompositionSnapshot {
  return compute(
    scenarioEmployees(hasOutliers).map((employee) => ({
      ordinal: employee.ordinal,
      gender: employee.gender as GenderEnum,
      score: employee.score,
      hourlyWage: scenarioHourlyWage(employee),
    })),
  )
}

const richDemo = richDemoFixture()

/**
 * The SAME 100-employee capture with **no** pay cut applied, and therefore
 * **compliant** — óskýrt 2,11% í óhag karla, comfortably inside the 3,9%
 * benchmark. This is the state the sheet was captured in; see
 * {@link DEMO_PAY_CUT} for why the úrbótaáætlun demos need it adjusted.
 *
 * It exists because the ábendingar list (`report-statistics/lib/pay-dispersion.ts`)
 * is only DISPLAYED on a compliant company, and every other compliant fixture is
 * six employees — below the statistic's `n ≥ 12` floor. Without this, the one
 * case a user actually sees would be the one case no fixture exercises.
 *
 * Not invented data: it is the pristine capture, at a real workforce's scale and
 * pay dispersion, with the adjustment simply not applied.
 */
const richDemoCompliant = richDemoFixture(0)

const fixtures = {
  __generated:
    'scripts/refresh-wage-gap-fixtures.ts — do not edit by hand; re-run the script',
  richSheet: richDemo.decomposition,
  richSheetCompliant: richDemoCompliant.decomposition,
  scenarioWithOutliers: scenarioSnapshot(true),
  scenarioWithoutOutliers: scenarioSnapshot(false),
}

/**
 * Writes JSON through the repo's own prettier.
 *
 * ⚠️ Raw `JSON.stringify` output is NOT what `.prettierrc` produces, so writing
 * it directly leaves the committed fixture one `nx format:write` away from a
 * spurious diff — regenerate and it drifts one way, format and it drifts back.
 * `refresh-template-data.js` had exactly this bug and it surfaced as a CI
 * failure claiming a generated file was stale when it was not.
 */
const writeFixture = async (path: string, value: unknown): Promise<void> => {
  const prettier = await import('prettier')
  const payload = `${JSON.stringify(value, null, 2)}\n`
  writeFileSync(
    path,
    await prettier.format(payload, {
      ...(await prettier.resolveConfig(path)),
      filepath: path,
    }),
  )
}

const out = join(DATA_DIR, 'wage-gap-fixtures.json')
const richOut = join(DATA_DIR, 'rich-demo-sheet.json')

void (async () => {
  await writeFixture(out, fixtures)
  await writeFixture(richOut, {
    __generated:
      'scripts/refresh-wage-gap-fixtures.ts — do not edit by hand; re-run the script',
    payCutPercent: richDemo.payCutPercent,
    criteria: richDemo.parsed.criteria,
    roles: richDemo.parsed.roles,
    employees: richDemo.parsed.employees,
    scores: richDemo.scores,
    chart: richDemo.chart,
  })
})()

const describe = (
  label: string,
  snapshot: WageGapDecompositionSnapshot,
): string =>
  [
    label.padEnd(24),
    `karlar/konur ${snapshot.counts.male}/${snapshot.counts.female}`.padEnd(20),
    `óskýrt ${snapshot.oskyrtPercent ?? '—'}%`.padEnd(18),
    `${snapshot.oskyrtDirection ?? 'engin átt'}`.padEnd(12),
    `lágmarksmengi ${snapshot.minimumSetSize}/${snapshot.gapCarrierCount}`,
  ].join(' ')

// eslint-disable-next-line no-console
console.log(
  [
    `Wrote ${out}`,
    `Wrote ${richOut} (konur −${richDemo.payCutPercent}%)`,
    describe('richSheet', fixtures.richSheet),
    describe('richSheetCompliant', fixtures.richSheetCompliant),
    describe('scenarioWithOutliers', fixtures.scenarioWithOutliers),
    describe('scenarioWithoutOutliers', fixtures.scenarioWithoutOutliers),
  ].join('\n'),
)
