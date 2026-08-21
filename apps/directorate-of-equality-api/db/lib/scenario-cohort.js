'use strict'

/**
 * The six-employee cohort every `seed-doe-scenarios` salary report is built
 * from — **the single definition**, read by two consumers:
 *
 *   1. `db/seeders/seed-doe-scenarios.js`, which turns it into `report_employee`
 *      rows.
 *   2. `scripts/refresh-wage-gap-fixtures.ts`, which feeds it through the real
 *      `computeWageGapDecomposition` to produce the frozen snapshot those same
 *      reports carry on `report_result`.
 *
 * It lives here, and not inline in the seeder, precisely so those two cannot
 * disagree. If the rows said one thing and the snapshot were computed from
 * another, the UI would show a gap figure that the employee list underneath it
 * does not imply — and nothing would flag it.
 *
 * ⚠️ In `db/lib/`, not `db/seeders/`: `db:seed:all` executes every `.js`
 * directly inside the seeders path, so a helper there would be run as a seeder.
 */

/**
 * A standard Icelandic month, used as the reference the varied contracts below
 * are expressed against.
 *
 * ⚠️ **Not every employee works this.** All six sat at exactly 173,33 until
 * 2026-08-20, which was bad seeding: an hours denominator is the point of this
 * analysis, so a constant denominator meant the seed data never exercised it —
 * and a constant denominator also hides the `mean(x)/mean(h)` vs `mean(x/h)`
 * distinction, which only differs when hours vary.
 */
const SEEDED_PAID_HOURS = 173.33

// Step scores, mirroring the criteria tree the same seeder inserts:
// `(stepOrder / numSteps) * subWeightPct * 10`.
const seedStepScore = (stepOrder, numSteps, subWeightPct) =>
  (stepOrder / numSteps) * subWeightPct * 10

const MANAGEMENT_WEIGHT = 30
const MANAGEMENT_STEPS = 3
const EDUCATION_WEIGHT = 40
const EDUCATION_STEPS = 4

const MANAGEMENT_LOW_SCORE = seedStepScore(
  1,
  MANAGEMENT_STEPS,
  MANAGEMENT_WEIGHT,
)
const MANAGEMENT_HIGH_SCORE = seedStepScore(
  3,
  MANAGEMENT_STEPS,
  MANAGEMENT_WEIGHT,
)
const EDUCATION_LOW_SCORE = seedStepScore(1, EDUCATION_STEPS, EDUCATION_WEIGHT)
const EDUCATION_HIGH_SCORE = seedStepScore(4, EDUCATION_STEPS, EDUCATION_WEIGHT)

/** 700 */
const MANAGER_TOTAL_SCORE = MANAGEMENT_HIGH_SCORE + EDUCATION_HIGH_SCORE
/** 500 */
const SPECIALIST_TOTAL_SCORE = MANAGEMENT_LOW_SCORE + EDUCATION_HIGH_SCORE
/** 200 */
const ASSISTANT_TOTAL_SCORE = MANAGEMENT_LOW_SCORE + EDUCATION_LOW_SCORE

/**
 * Ordinal 1's base pay is what separates the two scenario flavours:
 *
 * - `850000` → the man in the top role is paid well above the woman beside him
 *   on the same score, so óskýrt clears the 3,9% benchmark and the report has a
 *   lágmarksmengi to explain.
 * - `707000` → close enough to her that óskýrt stays under the benchmark, so the
 *   report needs no úrbótaáætlun at all.
 *
 * That is the ONLY difference between the two, which makes them a clean pair for
 * demoing both sides of the rule.
 */
const OUTLIER_BASE_SALARY = 850000
const COMPLIANT_BASE_SALARY = 707000

/**
 * Contract size per ordinal, as a multiple of a standard month. Deterministic —
 * no `Math.random`, so the generated fixtures are reproducible.
 *
 * ⚠️ **Pay scales with the contract, so the hourly RATES are unchanged.** That is
 * the point: the six monthly figures below were tuned to produce one report over
 * the benchmark and one under it, and varying hours without scaling pay destroys
 * that — a woman on 60% hours at 100% pay earns a *higher* rate, which flipped
 * óskýrt to 15% í óhag karla and made both flavours non-compliant when first
 * tried. Scaling together keeps every rate, and therefore every figure, exactly
 * as tuned while the denominator finally varies.
 */
const CONTRACT = {
  1: 1, // full-time
  2: 208 / SEEDED_PAID_HOURS, // real overtime — what starfshlutfall could not capture
  3: 1, // full-time
  4: 130 / SEEDED_PAID_HOURS, // a 75% contract
  5: 190 / SEEDED_PAID_HOURS, // modest overtime
  6: 104 / SEEDED_PAID_HOURS, // a 60% contract
}

/**
 * @param {boolean} hasOutliers Whether ordinal 1 is paid the elevated salary.
 * @returns The six employees, in ordinal order.
 */
function scenarioEmployees(hasOutliers) {
  const emp1Salary = hasOutliers ? OUTLIER_BASE_SALARY : COMPLIANT_BASE_SALARY

  // Applied below: hours and every pay field move by the same factor.
  const sized = (employee) => {
    const factor = CONTRACT[employee.ordinal]
    const scale = (v) =>
      v === null || v === undefined ? v : Math.round(v * factor)
    return {
      ...employee,
      paidHours: Math.round(SEEDED_PAID_HOURS * factor * 100) / 100,
      baseSalary: Math.round(employee.baseSalary * factor),
      additionalFixedOvertime: scale(employee.additionalFixedOvertime),
      bonusPayments: scale(employee.bonusPayments),
    }
  }

  return [
    {
      ordinal: 1,
      gender: 'MALE',
      roleIndex: 0,
      score: MANAGER_TOTAL_SCORE,
      field: 'Viðskiptafræði',
      department: 'Stjórnun',
      startDate: '2015-01-15',
      paidHours: SEEDED_PAID_HOURS,
      baseSalary: emp1Salary,
      additionalFixedOvertime: 50000,
      bonusPayments: 100000,
    },
    {
      ordinal: 2,
      gender: 'FEMALE',
      roleIndex: 0,
      score: MANAGER_TOTAL_SCORE,
      field: 'Viðskiptafræði',
      department: 'Stjórnun',
      startDate: '2017-03-01',
      paidHours: SEEDED_PAID_HOURS,
      baseSalary: 703000,
      additionalFixedOvertime: 50000,
      bonusPayments: 80000,
    },
    {
      ordinal: 3,
      gender: 'MALE',
      roleIndex: 1,
      score: SPECIALIST_TOTAL_SCORE,
      field: 'Tölvunarfræði',
      department: 'Þróun',
      startDate: '2018-06-01',
      paidHours: SEEDED_PAID_HOURS,
      baseSalary: 602000,
      additionalFixedOvertime: 30000,
      bonusPayments: 50000,
    },
    {
      ordinal: 4,
      gender: 'FEMALE',
      roleIndex: 1,
      score: SPECIALIST_TOTAL_SCORE,
      field: 'Tölvunarfræði',
      department: 'Þróun',
      startDate: '2019-09-01',
      paidHours: SEEDED_PAID_HOURS,
      baseSalary: 598000,
      additionalFixedOvertime: 30000,
      bonusPayments: 40000,
    },
    {
      ordinal: 5,
      gender: 'MALE',
      roleIndex: 2,
      score: ASSISTANT_TOTAL_SCORE,
      field: 'Almenn námsbraut',
      department: 'Þjónusta',
      startDate: '2020-01-01',
      paidHours: SEEDED_PAID_HOURS,
      baseSalary: 502000,
      additionalFixedOvertime: 10000,
      bonusPayments: null,
    },
    {
      ordinal: 6,
      gender: 'FEMALE',
      roleIndex: 2,
      score: ASSISTANT_TOTAL_SCORE,
      field: 'Almenn námsbraut',
      department: 'Þjónusta',
      startDate: '2021-06-01',
      paidHours: SEEDED_PAID_HOURS,
      baseSalary: 498000,
      additionalFixedOvertime: 10000,
      bonusPayments: null,
    },
  ].map(sized)
}

/** Reglulegt tímakaup: (grunnlaun + viðbótarlaun + aukagreiðslur) / greiddar stundir. */
function scenarioHourlyWage(employee) {
  return (
    (employee.baseSalary +
      (employee.additionalFixedOvertime ?? 0) +
      (employee.bonusPayments ?? 0)) /
    employee.paidHours
  )
}

module.exports = {
  SEEDED_PAID_HOURS,
  MANAGEMENT_LOW_SCORE,
  MANAGEMENT_HIGH_SCORE,
  EDUCATION_LOW_SCORE,
  EDUCATION_HIGH_SCORE,
  MANAGER_TOTAL_SCORE,
  SPECIALIST_TOTAL_SCORE,
  ASSISTANT_TOTAL_SCORE,
  OUTLIER_BASE_SALARY,
  COMPLIANT_BASE_SALARY,
  scenarioEmployees,
  scenarioHourlyWage,
}
