/**
 * Regenerates `db/seeders/data/reference-company.json` from the Directorate's
 * simulated workbook, `launagogn_hermd_launamunur.xlsx`.
 *
 * ## Why this exists
 *
 * That workbook is the input to Jafnréttisstofa's own R analysis
 * (`launamunur_greining.R`). Seeding it as a real report means our figures can be
 * read off the UI and compared to the R script's printed output side by side,
 * on identical data — rather than only inside a spec.
 *
 * ## The workbook is NOT in this repo
 *
 * It is the Directorate's file and lives outside the tree; only the derived JSON
 * is committed, which is the same arrangement as
 * `src/modules/report/lib/__fixtures__/reference-cohort.json`. Pass its path when
 * regenerating:
 *
 *   yarn nx run directorate-of-equality-api:refresh-reference-company \
 *     ~/Downloads/launagogn_hermd_launamunur.xlsx
 *
 * Kept out of `refresh-wage-gap-fixtures.ts` deliberately: that script must run
 * from a clean checkout with no external inputs, and CI regenerates it.
 *
 * ## Mapping the workbook onto our schema
 *
 * The R script computes `regluleg laun = grunnlaun + vaktaalag + onnur_alag +
 * bonus`. We collect six named components instead, so the four columns are
 * distributed across them such that the SUM is identical — which is all the
 * analysis depends on:
 *
 *   grunnlaun   → base_salary
 *   vaktaalag   → additional_fixed_overtime   (viðbótarlaun)
 *   onnur_alag  → additional_fixed_car_allowance (viðbótarlaun)
 *   bonus       → bonus_payments              (aukagreiðslur)
 *
 * ⚠️ **Score is the raw `haefni1 + haefni2 + haefni3`, so 3–15.** The R script
 * prints exactly this as `haefni_summa`, so an employee's score is comparable
 * row for row. It is deliberately NOT rescaled to look like our other seeded
 * companies (700/500/200): óskýrt is invariant under a linear rescaling of score
 * — `(s̄_M − s̄_W)` scales by k while β*₁ scales by 1/k, so `explained` is
 * unchanged — which means rescaling would buy a prettier chart and cost the
 * row-by-row comparability that is the entire point of this fixture.
 *
 * The visible consequence: the chart's x-axis rounds up to 250, so 120 points
 * sit in its left 6%. That is expected here and not a bug.
 */

import ExcelJS from 'exceljs'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

import {
  computeWageGapDecomposition,
  roundWageGapDecompositionSnapshot,
  type WageGapEmployeeInput,
} from '../src/modules/report/lib/wage-gap-decomposition'
import { GenderEnum } from '../src/modules/report/models/report.enums'
import { buildChartFromEmployeePoints } from '../src/modules/report-statistics/lib/build-chart'

const BENCHMARK_PERCENT = 3.9
const DATA_DIR = join(__dirname, '..', 'db', 'seeders', 'data')
const OUT = join(DATA_DIR, 'reference-company.json')
const SHEET = 'Laun'

const DEFAULT_SOURCE = join(
  process.env.HOME ?? '',
  'Downloads',
  'launagogn_hermd_launamunur.xlsx',
)

type ReferenceEmployee = {
  ordinal: number
  gender: GenderEnum
  /** haefni1 + haefni2 + haefni3, 3–15. See the note above. */
  score: number
  /** The three hæfni items, kept so the seeded criteria tree can reproduce them. */
  haefni: [number, number, number]
  paidHours: number
  baseSalary: number
  additionalFixedOvertime: number
  additionalFixedCarAllowance: number
  bonusPayments: number
  /** Fullvinnandi | Hlutastarf — the workbook's own `stada`, used as the role. */
  role: string
}

async function readWorkbook(path: string): Promise<ReferenceEmployee[]> {
  // Fail loudly and early: a missing workbook is the likeliest way to run this.
  readFileSync(path)

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(path)
  const sheet = workbook.getWorksheet(SHEET)
  if (!sheet) throw new Error(`Workbook has no "${SHEET}" sheet`)

  const text = (row: number, col: number): string =>
    String(sheet.getCell(row, col).value ?? '').trim()
  const num = (row: number, col: number): number => {
    const value = sheet.getCell(row, col).value
    const parsed = typeof value === 'number' ? value : Number(value ?? 0)
    if (!Number.isFinite(parsed)) {
      throw new Error(`Row ${row} col ${col} is not numeric: ${String(value)}`)
    }
    return parsed
  }

  const employees: ReferenceEmployee[] = []
  for (let row = 2; row <= sheet.rowCount; row++) {
    if (!text(row, 1)) continue

    const kyn = text(row, 2)
    if (kyn !== 'Karl' && kyn !== 'Kona') {
      throw new Error(`Row ${row} has unexpected kyn "${kyn}"`)
    }

    const haefni: [number, number, number] = [
      num(row, 10),
      num(row, 11),
      num(row, 12),
    ]
    for (const value of haefni) {
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new Error(`Row ${row} has a hæfni value outside 1–5: ${value}`)
      }
    }

    employees.push({
      ordinal: employees.length + 1,
      gender: kyn === 'Kona' ? GenderEnum.FEMALE : GenderEnum.MALE,
      score: haefni[0] + haefni[1] + haefni[2],
      haefni,
      paidHours: num(row, 9),
      baseSalary: num(row, 5),
      additionalFixedOvertime: num(row, 6),
      additionalFixedCarAllowance: num(row, 7),
      bonusPayments: num(row, 8),
      role: text(row, 4) || 'Fullvinnandi',
    })
  }

  return employees
}

const hourlyWageOf = (employee: ReferenceEmployee): number =>
  (employee.baseSalary +
    employee.additionalFixedOvertime +
    employee.additionalFixedCarAllowance +
    employee.bonusPayments) /
  employee.paidHours

async function main(): Promise<void> {
  const source = process.argv[2] ?? DEFAULT_SOURCE
  const employees = await readWorkbook(source)

  const decompositionInput: WageGapEmployeeInput[] = employees.map((e) => ({
    ordinal: e.ordinal,
    gender: e.gender,
    score: e.score,
    hourlyWage: hourlyWageOf(e),
  }))

  // The real engine, with the persistence rounding — so the committed snapshot
  // is byte-for-byte what a submit would freeze for these rows.
  const decomposition = roundWageGapDecompositionSnapshot(
    computeWageGapDecomposition({
      employees: decompositionInput,
      benchmarkPercent: BENCHMARK_PERCENT,
    }),
  )

  const chart = buildChartFromEmployeePoints(
    employees.map((e) => ({
      score: e.score,
      regularHourlyWage: hourlyWageOf(e),
      gender: e.gender,
    })),
  )

  const males = employees.filter((e) => e.gender === GenderEnum.MALE).length

  // ⚠️ Formatted with the repo's own prettier before writing. Raw
  // `JSON.stringify` output is NOT what `.prettierrc` produces, so without this
  // the committed fixture drifts the moment anyone runs `nx format:write` —
  // exactly the trap `refresh-template-data.js` had.
  const payload = `${JSON.stringify(
    {
      __generated:
        'scripts/refresh-reference-company.ts — do not edit by hand; re-run the script',
      __source:
        'launagogn_hermd_launamunur.xlsx (Jafnréttisstofa simulated data, not in this repo)',
      counts: {
        total: employees.length,
        male: males,
        female: employees.length - males,
      },
      employees,
      decomposition,
      chart,
    },
    null,
    2,
  )}\n`

  const prettier = await import('prettier')
  writeFileSync(
    OUT,
    await prettier.format(payload, {
      ...(await prettier.resolveConfig(OUT)),
      filepath: OUT,
    }),
  )

  // eslint-disable-next-line no-console
  console.log(
    [
      `Wrote db/seeders/data/reference-company.json`,
      `  employees        ${employees.length} (${males} karlar / ${employees.length - males} konur)`,
      `  óleiðréttur      ${decomposition.rawGapPercent}% ${decomposition.rawGapDirection}`,
      `  leiðréttur       ${decomposition.oskyrtPercent}% ${decomposition.oskyrtDirection}`,
      `  correctable      ${decomposition.correctableCount}`,
      `  lágmarksmengi    ${decomposition.minimumSetSize}`,
      `  closes the gap   ${decomposition.minimumSetClosesGap}`,
    ].join('\n'),
  )
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
