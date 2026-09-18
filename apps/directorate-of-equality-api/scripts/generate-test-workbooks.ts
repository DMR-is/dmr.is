/**
 * Generates filled **template 2.0** salary workbooks for manual UI testing.
 *
 *     yarn nx run directorate-of-equality-api:generate-test-workbooks
 *     # or: ts-node --project tsconfig.app.json -O '{"module":"commonjs"}' \
 *     #       scripts/generate-test-workbooks.ts [outDir]
 *
 * ── Why a generator and not three hand-filled spreadsheets ──────────────────
 *
 * Each workbook has to land on a *specific* analysis outcome — inside the 3,9%
 * benchmark, over it with a closable lágmarksmengi, or compliant with a
 * populated ábendingar list. Those outcomes come out of a log-space
 * Oaxaca-Blinder fit; you cannot type cells until they happen. So the cohort is
 * built from a wage model, calibrated against the REAL engine
 * (`computeWageGapDecomposition` / `computePayDispersion`) by bisection, and
 * only then written to a workbook.
 *
 * Every file is then round-tripped through the REAL importer
 * (`parseWorkbook` → `assertParsedPayloadIntegrity` → `computeEmployeeScores`)
 * and the resulting figures are re-checked against the calibration. A workbook
 * that would 400 on upload, or that would show different numbers from the ones
 * printed here, fails the run instead of being written.
 *
 * ⚠️ **exceljs drops `docProps/custom.xml` on write** (and `cp:version` from
 * `core.xml`), which is where the template version lives. The properties are
 * re-injected from the template's own archive after `writeBuffer`, exactly as
 * `workbook.parser.spec.ts` does.
 *
 * The gate would now accept these files without that, via the visible mirror
 * on `Leiðbeiningar!C4` — see the source chain in `template-version.assert.ts`.
 * The re-injection stays because a file that resolves on tier 1 is what a real
 * Excel-saved upload looks like, and these fixtures are for exercising the
 * normal path, not the fallback. The fallback has its own tests.
 */
import ExcelJS from 'exceljs'
import { readFileSync, writeFileSync } from 'fs'
import JSZip from 'jszip'
import { homedir } from 'os'
import { join } from 'path'

import { getRegularHourlyWage } from '@dmr.is/doe-modules/report'
import {
  assertParsedPayloadIntegrity,
  computeEmployeeScores,
} from '@dmr.is/doe-modules/report'
import {
  computeWageGapDecomposition,
  gapPercentFromLog,
  roundWageGapDecompositionSnapshot,
  type WageGapDecompositionSnapshot,
  WageGapDirectionEnum,
} from '@dmr.is/doe-modules/report'
import { GenderEnum } from '@dmr.is/doe-modules/report'
import { parseWorkbook } from '@dmr.is/doe-modules/report-excel'
import {
  computeStepScore,
  GENDER_ENUM_TO_DISPLAY,
  SHEETS,
} from '@dmr.is/doe-modules/report-excel'
import {
  computePayDispersion,
  studentizedResiduals,
} from '@dmr.is/doe-modules/report-statistics'

/** The statutory benchmark, matching the seeded `config` row. */
const BENCHMARK_PERCENT = 3.9

// ── The wage model ──────────────────────────────────────────────────────────
//
// `log(tímakaup) = A + B·stig + genderShift + residual`, i.e. the shape the
// engine fits, so a cohort built from it produces a sane R² and a reference
// curve that looks like a real one. Anchored on two plausible 2026 points:
// 250 stig → 3.100 kr/klst (~537 þ.kr/mán), 700 stig → 8.200 kr/klst. The
// anchors are deliberately generous at the bottom: the residual spread is wide
// (see `baselineResiduals`), and an anchor at the minimum wage would put the
// low tail below anything a payroll would actually pay.
const B_SLOPE = (Math.log(8200) - Math.log(3100)) / (700 - 250)
const A_INTERCEPT = Math.log(3100) - B_SLOPE * 250

// ── Criteria tree, shared by all three companies ────────────────────────────
//
// ⚠️ Row order on Undirviðmið IS the column order of the two Flokkun matrices
// (see `criteria.parser.ts`), so JOB_SUBS is written in this order and the
// Starfsmat step tuples below are indexed by it.
type SubSpec = {
  parent: string
  title: string
  description: string
  weight: number
  steps: number
}

const JOB_SUBS: SubSpec[] = [
  {
    parent: 'Ábyrgð',
    title: 'Ábyrgð á fólki',
    description: 'Mannaforráð, starfsþróun og ábyrgð á vinnu annarra.',
    weight: 15,
    steps: 5,
  },
  {
    parent: 'Ábyrgð',
    title: 'Ábyrgð á fjármálum og verðmætum',
    description: 'Ábyrgð á fjárhagsáætlun, samningum, tækjum og verðmætum.',
    weight: 15,
    steps: 5,
  },
  {
    parent: 'Álag',
    title: 'Vinnuálag og tímapressa',
    description: 'Hraði, verkefnafjöldi og tímapressa í daglegu starfi.',
    weight: 12,
    steps: 4,
  },
  {
    parent: 'Álag',
    title: 'Tilfinningalegt álag',
    description: 'Samskipti við viðskiptavini, erfið mál og andlegt álag.',
    weight: 8,
    steps: 4,
  },
  {
    parent: 'Vinnuaðstæður',
    title: 'Vinnuumhverfi og öryggi',
    description: 'Hávaði, hiti, óhreinindi, líkamlegt erfiði og öryggisáhætta.',
    weight: 10,
    steps: 3,
  },
  {
    parent: 'Vinnuaðstæður',
    title: 'Vaktir og ferðalög',
    description: 'Vaktavinna, útkall, breytilegur vinnutími og ferðalög.',
    weight: 10,
    steps: 3,
  },
  {
    parent: 'Hæfni',
    title: 'Formleg menntun',
    description: 'Menntunarkröfur starfsins og formleg réttindi.',
    weight: 12,
    steps: 5,
  },
  {
    parent: 'Hæfni',
    title: 'Reynsla og starfsaldur',
    description: 'Krafa um starfsreynslu og sérhæfða þekkingu í starfi.',
    weight: 8,
    steps: 4,
  },
]

const PERSONAL_CRITERION = {
  title: 'Sérhæfing',
  description:
    'Einstaklingsbundið viðmið: sérhæfð þekking og færni sem starfsmaður leggur til.',
  weight: 10,
}

const PERSONAL_SUB: SubSpec = {
  parent: PERSONAL_CRITERION.title,
  title: 'Sérhæfð þekking og tungumál',
  description: 'Viðbótarþekking, vottanir og tungumálakunnátta starfsmanns.',
  weight: 10,
  steps: 5,
}

/** Job criteria as the template ships them (Viðmið rows 6–9), plus weights. */
const JOB_CRITERIA: Array<{ row: number; title: string; weight: number }> = [
  { row: 6, title: 'Ábyrgð', weight: 30 },
  { row: 7, title: 'Álag', weight: 20 },
  { row: 8, title: 'Vinnuaðstæður', weight: 20 },
  { row: 9, title: 'Hæfni', weight: 20 },
]

/** Þrep labels per step count — the template's `Þrep 1…8` columns. */
const stepLabels = (n: number): string[] => {
  const scales: Record<number, string[]> = {
    3: ['Lítið', 'Miðlungs', 'Mikið'],
    4: ['Lítið', 'Nokkuð', 'Mikið', 'Mjög mikið'],
    5: ['Lítið', 'Nokkuð', 'Miðlungs', 'Mikið', 'Mjög mikið'],
  }
  const scale = scales[n]
  if (!scale) throw new Error(`No þrep labels defined for ${n} steps`)
  return scale.map((label, i) => `${i + 1}. ${label}`)
}

const roleScore = (steps: number[]): number =>
  JOB_SUBS.reduce(
    (total, sub, i) => total + computeStepScore(steps[i], sub.steps, sub.weight),
    0,
  )

const personalScore = (step: number): number =>
  computeStepScore(step, PERSONAL_SUB.steps, PERSONAL_SUB.weight)

// ── Deterministic pseudo-randomness ─────────────────────────────────────────
//
// Every run must produce byte-identical cohorts: these files get uploaded,
// screenshotted and talked about, so "the file I tested" has to stay one thing.
const lcg = (seed: number) => {
  let state = seed >>> 0
  return (): number => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

// ── Company definitions ─────────────────────────────────────────────────────
type RoleSpec = {
  title: string
  /** One þrep per JOB_SUBS entry, in that order. */
  steps: number[]
  count: number
  /** Used only to skew WHICH employees get which gender, never the counts. */
  femaleShare: number
  field: string
  department: string
  /** Managers get a fixed car allowance (column K). */
  carAllowance?: number
}

type CompanySpec = {
  slug: string
  label: string
  roles: RoleSpec[]
  females: number
  neutrals: number
  seed: number
  /** Baseline residual spread in log points before any injection. */
  residualSigma: number
  /** What the calibration aims `oskyrtPercent` at. */
  targetOskyrtPercent: number
  /**
   * Which knob the bisection turns to reach that target: the uniform gender
   * shift, or the size of the injected individual deviations.
   */
  tune: 'genderShift' | 'injection'
  /** Fixed gender shift when `tune === 'injection'`. */
  baseGenderShift?: number
  injections?: InjectionSpec[]
}

/**
 * An individual pay deviation planted on top of the model. `select` picks the
 * employees by gender and position in the score order, so the same cohort
 * always plants them on the same people.
 */
type InjectionSpec = {
  gender: GenderEnum
  /**
   * Where in that gender's stig order the targets come from. `spread` walks the
   * whole order at even intervals.
   *
   * ⚠️ `spread` + {@link InjectionSpec.alternate} is the only combination that
   * leaves the fit alone. Planting every rise at the top of the score order and
   * every cut at the bottom correlates the residual with stig, which STEEPENS
   * the pooled slope — so part of the planted gender gap is reclassified as
   * *explained* and the deviations shrink against their own tilted line. That
   * cost company 3 five of its eight intended ábendingar before this existed.
   */
  from: 'top' | 'bottom' | 'middle' | 'spread'
  count: number
  /** Log-point shift. Scaled by the tuned factor when `tune === 'injection'`. */
  shift: number
  /** Flip the shift's sign on every second target. */
  alternate?: boolean
}

const COMPANIES: CompanySpec[] = [
  // ── 1. 120 employees, inside the benchmark ────────────────────────────────
  //
  // Residuals are spread EVENLY rather than drawn from a normal: an internally
  // studentized residual is scale-free, so ~4,6% of any normally-scattered
  // cohort exceeds |t| ≥ 2 whatever σ is. An even spread bounds max |t| at
  // ≈ √3 < 2, so this company is clean on BOTH instruments — compliant, no
  // lágmarksmengi, and an ábendingar section in its all-clear state.
  {
    slug: '1-innan-vidmids-120',
    label: 'Norðurljós Tæknihús hf. — 120 starfsmenn, innan 3,9% viðmiðs',
    females: 62,
    neutrals: 5,
    seed: 20260909,
    residualSigma: 0.32,
    targetOskyrtPercent: 2.6,
    tune: 'genderShift',
    roles: [
      { title: 'Forstjóri', steps: [5, 5, 4, 4, 1, 2, 5, 4], count: 1, femaleShare: 0.2, field: 'Stjórnun', department: 'Framkvæmdastjórn', carAllowance: 95000 },
      { title: 'Þróunarstjóri', steps: [4, 5, 4, 3, 1, 2, 5, 4], count: 3, femaleShare: 0.3, field: 'Stjórnun', department: 'Þróun', carAllowance: 60000 },
      { title: 'Sölustjóri', steps: [4, 4, 4, 3, 1, 3, 4, 3], count: 2, femaleShare: 0.4, field: 'Sala', department: 'Sala og markaðir', carAllowance: 60000 },
      { title: 'Verkefnastjóri', steps: [3, 3, 4, 3, 1, 2, 4, 3], count: 8, femaleShare: 0.5, field: 'Þróun', department: 'Verkefnastofa' },
      { title: 'Sérfræðingur', steps: [2, 3, 3, 2, 1, 1, 5, 4], count: 24, femaleShare: 0.45, field: 'Þróun', department: 'Sérfræðisvið' },
      { title: 'Hugbúnaðarsmiður', steps: [2, 2, 3, 2, 1, 1, 4, 2], count: 42, femaleShare: 0.35, field: 'Þróun', department: 'Hugbúnaðargerð' },
      { title: 'Þjónusturáðgjafi', steps: [1, 2, 2, 3, 2, 1, 2, 2], count: 26, femaleShare: 0.75, field: 'Þjónusta', department: 'Þjónustuver' },
      { title: 'Skrifstofumaður', steps: [1, 1, 2, 2, 1, 1, 2, 2], count: 14, femaleShare: 0.85, field: 'Stoðsvið', department: 'Skrifstofa' },
    ],
  },

  // ── 2. ~50 employees, over the benchmark, with a lágmarksmengi ────────────
  //
  // A uniform gender shift carries the gap and a few concentrated deviations
  // give the selection walk clear top carriers to pick first.
  //
  // ⚠️ Concentrated deviations ALONE cannot reach a target óskýrt on a cohort
  // this small: β*₁ is estimated from the very wages they move, so a large
  // planted deviation partly re-fits the line under itself. Scaling the pair
  // below by 4 — men at +0,8 and women at −1,2 log points, i.e. pay that is
  // nonsense on its face — still only reached 5,7%. The uniform shift does not
  // have that ceiling because it moves both cohorts' means without touching
  // the slope.
  //
  // Both directions are planted on purpose: `contributionLog` is `residual/n`
  // per gender, so with 20 men and 30 women a man at +0,18 and a woman at
  // −0,22 carry comparable weight — the walk interleaves them instead of
  // exhausting one side first, which is what gives the úrbótaáætlun UI a
  // mixed-direction set to render.
  {
    slug: '2-lagmarksmengi-50',
    label: 'Vesturvík Þjónusta hf. — 50 starfsmenn, yfir viðmiði, lágmarksmengi',
    females: 30,
    neutrals: 0,
    seed: 5150,
    residualSigma: 0.26,
    targetOskyrtPercent: 8.5,
    tune: 'genderShift',
    // ⚠️ The two shifts are sized against the COHORT sizes, not against each
    // other. `contributionLog` is `residual / n` per gender, so with 20 men and
    // 30 women a man's deviation counts 1,5× a woman's — and a set built by
    // walking |framlag| takes every man before it reaches any woman unless the
    // women's deviations are scaled up to compensate. At +0,16 against −0,30
    // the two carry ~0,011 each and the walk interleaves them, which is what
    // gives the úrbótaáætlun UI a set spanning both directions to group.
    injections: [
      { gender: GenderEnum.MALE, from: 'top', count: 4, shift: 0.16 },
      { gender: GenderEnum.FEMALE, from: 'middle', count: 5, shift: -0.3 },
    ],
    roles: [
      { title: 'Framkvæmdastjóri', steps: [5, 5, 4, 4, 1, 2, 5, 4], count: 1, femaleShare: 0.3, field: 'Stjórnun', department: 'Framkvæmdastjórn', carAllowance: 90000 },
      { title: 'Deildarstjóri', steps: [4, 4, 3, 3, 2, 2, 4, 3], count: 3, femaleShare: 0.4, field: 'Stjórnun', department: 'Deildarstjórn', carAllowance: 55000 },
      { title: 'Verkstjóri', steps: [3, 2, 3, 3, 3, 2, 3, 3], count: 5, femaleShare: 0.4, field: 'Rekstur', department: 'Vaktstjórn' },
      { title: 'Þjónusturáðgjafi', steps: [2, 2, 3, 3, 2, 2, 3, 2], count: 16, femaleShare: 0.7, field: 'Þjónusta', department: 'Þjónustuver' },
      { title: 'Starfsmaður í afgreiðslu', steps: [1, 1, 3, 3, 2, 3, 2, 2], count: 17, femaleShare: 0.75, field: 'Þjónusta', department: 'Afgreiðsla' },
      { title: 'Starfsmaður í ræstingu', steps: [1, 1, 2, 2, 3, 2, 1, 1], count: 8, femaleShare: 0.8, field: 'Rekstur', department: 'Umsjón húsnæðis' },
    ],
  },

  // ── 3. ~50 employees, compliant, with ábendingar ──────────────────────────
  //
  // Deviations are planted SYMMETRICALLY inside each gender — two up and two
  // down for both, spread through the stig order so they cancel in the mean
  // AND leave the slope alone. óskýrt therefore stays where the tuned gender
  // shift puts it. That is exactly the case §10 of `docs/launagreining.md`
  // exists for: no aggregate gender gap, and individuals a long way from what
  // their stig imply. Baseline σ is kept below the planted shift so the
  // planted rows dominate the spread and clear |t| ≥ 2 instead of BECOMING the
  // spread — past about a quarter of the workforce the deviant group is the
  // spread and stops being unusual at all.
  {
    slug: '3-abendingar-50',
    label: 'Höfðaborg Framleiðsla hf. — 50 starfsmenn, innan viðmiðs, ábendingar',
    females: 20,
    neutrals: 0,
    seed: 771,
    residualSigma: 0.1,
    targetOskyrtPercent: 2,
    tune: 'genderShift',
    injections: [
      { gender: GenderEnum.FEMALE, from: 'spread', count: 4, shift: 0.45, alternate: true },
      { gender: GenderEnum.MALE, from: 'spread', count: 4, shift: 0.45, alternate: true },
    ],
    roles: [
      { title: 'Framleiðslustjóri', steps: [5, 4, 4, 3, 2, 2, 4, 4], count: 1, femaleShare: 0.2, field: 'Stjórnun', department: 'Framkvæmdastjórn', carAllowance: 85000 },
      { title: 'Vörustjóri', steps: [3, 4, 3, 2, 2, 2, 4, 3], count: 3, femaleShare: 0.3, field: 'Stjórnun', department: 'Vöruhús', carAllowance: 50000 },
      { title: 'Vélstjóri', steps: [2, 2, 3, 2, 3, 2, 3, 4], count: 6, femaleShare: 0.15, field: 'Framleiðsla', department: 'Vélasalur' },
      { title: 'Tæknimaður', steps: [2, 2, 3, 2, 3, 2, 3, 2], count: 9, femaleShare: 0.25, field: 'Framleiðsla', department: 'Viðhald' },
      { title: 'Framleiðslustarfsmaður', steps: [1, 1, 2, 3, 3, 3, 1, 2], count: 21, femaleShare: 0.45, field: 'Framleiðsla', department: 'Framleiðslulína' },
      { title: 'Lagerstarfsmaður', steps: [1, 1, 2, 2, 3, 3, 1, 1], count: 10, femaleShare: 0.35, field: 'Rekstur', department: 'Lager' },
    ],
  },
]

// ── Cohort construction ─────────────────────────────────────────────────────
type Employee = {
  ordinal: number
  name: string
  role: RoleSpec
  gender: GenderEnum
  personalStep: number
  score: number
  paidHours: number
  startDate: Date
  baseSalary: number
  additionalFixedOvertime: number | null
  additionalFixedCarAllowance: number | null
  additionalFixedOther: number | null
  bonusOccasionalOvertime: number | null
  bonusOccasionalCarAllowance: number | null
  bonusOther: number | null
  hourlyWage: number
}

/** Greiddar stundir — a standard Icelandic month, and the variations around it. */
const STANDARD_MONTH = 173.33

/**
 * Contract shapes, cycled deterministically. A constant denominator would hide
 * the whole point of an hours-based rate (and the `mean(x)/mean(h)` vs
 * `mean(x/h)` distinction), which is the bug the seed cohort had until it was
 * given varied hours.
 */
const HOURS_CYCLE = [
  STANDARD_MONTH,
  STANDARD_MONTH,
  STANDARD_MONTH,
  190,
  STANDARD_MONTH,
  130,
  STANDARD_MONTH,
  208,
  STANDARD_MONTH,
  86.67,
  STANDARD_MONTH,
  182,
]

type Skeleton = Omit<
  Employee,
  | 'baseSalary'
  | 'additionalFixedOvertime'
  | 'additionalFixedCarAllowance'
  | 'additionalFixedOther'
  | 'bonusOccasionalOvertime'
  | 'bonusOccasionalCarAllowance'
  | 'bonusOther'
  | 'hourlyWage'
  | 'gender'
> & { gender: GenderEnum }

/**
 * Roles, headcounts, stig, hours and genders — everything that does not depend
 * on the pay parameters, so the bisection below rebuilds only the pay.
 *
 * Gender counts are EXACT (the spec asks for a given split) while the skew is
 * only a preference: every employee gets a "femaleness" key from their role's
 * share plus deterministic jitter, and the top `females` keys take FEMALE. So
 * managers skew male without the totals drifting.
 */
const buildSkeleton = (company: CompanySpec): Skeleton[] => {
  const rand = lcg(company.seed)
  const rows: Array<Omit<Skeleton, 'gender'> & { femaleKey: number }> = []
  let ordinal = 0

  for (const role of company.roles) {
    const base = roleScore(role.steps)
    for (let i = 0; i < role.count; i++) {
      ordinal++
      // Personal þrep tracks seniority (higher-stig roles hold more of the
      // specialist knowledge) with jitter, so it is neither constant nor noise.
      const seniority = (base - 300) / 500
      const personalStep = Math.min(
        5,
        Math.max(1, Math.round(1.4 + seniority * 2.6 + rand() * 1.8)),
      )
      rows.push({
        ordinal,
        name: `Starfsmaður ${String(ordinal).padStart(3, '0')}`,
        role,
        personalStep,
        score: base + personalScore(personalStep),
        paidHours: HOURS_CYCLE[(ordinal - 1) % HOURS_CYCLE.length],
        // Hire dates spread over ~20 years, deterministic per ordinal.
        startDate: new Date(
          Date.UTC(
            2006 + ((ordinal * 7) % 20),
            (ordinal * 5) % 12,
            1 + ((ordinal * 11) % 27),
          ),
        ),
        femaleKey: role.femaleShare + (rand() - 0.5) * 0.25,
      })
    }
  }

  const byFemaleKey = [...rows].sort((a, b) => b.femaleKey - a.femaleKey)
  const genderByOrdinal = new Map<number, GenderEnum>()
  byFemaleKey.forEach((row, index) => {
    genderByOrdinal.set(
      row.ordinal,
      index < company.females
        ? GenderEnum.FEMALE
        : index < company.females + company.neutrals
          ? GenderEnum.NEUTRAL
          : GenderEnum.MALE,
    )
  })

  return rows.map(({ femaleKey: _femaleKey, ...row }) => ({
    ...row,
    gender: genderByOrdinal.get(row.ordinal) as GenderEnum,
  }))
}

/**
 * Baseline residuals: `sigma × an even spread over [−1, 1]`, permuted.
 *
 * ⚠️ Deliberately NOT normal. `|t|` is scale-free, so a normal scatter puts
 * ~4,6% of ANY cohort over the ábendingar threshold no matter how small σ is —
 * which would give company 1 a list it is not supposed to have. An even spread
 * caps max |t| near √3, leaving the planted deviations as the only rows that
 * can clear 2.
 */
const baselineResiduals = (n: number, sigma: number, seed: number): number[] => {
  const spread = Array.from({ length: n }, (_, i) =>
    n === 1 ? 0 : (-1 + (2 * i) / (n - 1)) * sigma,
  )
  const rand = lcg(seed)
  for (let i = spread.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[spread[i], spread[j]] = [spread[j], spread[i]]
  }
  return spread
}

/** Which ordinals an injection lands on — by gender, by position in stig order. */
const injectionTargets = (
  skeleton: Skeleton[],
  injection: InjectionSpec,
): number[] => {
  const group = skeleton
    .filter(
      (e) =>
        (e.gender === GenderEnum.NEUTRAL ? GenderEnum.FEMALE : e.gender) ===
        injection.gender,
    )
    .sort((a, b) => b.score - a.score || a.ordinal - b.ordinal)

  if (injection.from === 'top') {
    return group.slice(0, injection.count).map((e) => e.ordinal)
  }
  if (injection.from === 'bottom') {
    return group.slice(-injection.count).map((e) => e.ordinal)
  }
  if (injection.from === 'spread') {
    // Evenly spaced through the order, offset half a stride so neither the
    // top nor the bottom employee is ever a target — those two carry the most
    // leverage, and moving them tilts the line the hardest.
    const stride = group.length / injection.count
    return Array.from({ length: injection.count }, (_, i) =>
      group[Math.min(group.length - 1, Math.floor(stride * (i + 0.5)))].ordinal,
    )
  }
  const start = Math.max(0, Math.floor(group.length / 2) - 1)
  return group.slice(start, start + injection.count).map((e) => e.ordinal)
}

/**
 * Turn a target hourly rate into the six pay columns plus grunnlaun.
 *
 * The fixed band (I–L) has to reproduce the rate exactly, so grunnlaun is
 * whatever is left after the fixed extras. The incidental band (M–O) is filled
 * for some employees precisely BECAUSE it must not move any figure — template
 * 2.0 dropped aukagreiðslur from regluleg laun, and a workbook with an empty
 * M–O would not test that.
 */
const composePay = (
  skeleton: Skeleton,
  targetHourlyWage: number,
): Pick<
  Employee,
  | 'baseSalary'
  | 'additionalFixedOvertime'
  | 'additionalFixedCarAllowance'
  | 'additionalFixedOther'
  | 'bonusOccasionalOvertime'
  | 'bonusOccasionalCarAllowance'
  | 'bonusOther'
  | 'hourlyWage'
> => {
  const regular = Math.round(targetHourlyWage * skeleton.paidHours)

  const carAllowance = skeleton.role.carAllowance ?? null
  // Fixed overtime is paid where the contract carries hours above a standard
  // month — that is what "föst yfirvinna" means on the sheet.
  const fixedOvertime =
    skeleton.paidHours > STANDARD_MONTH
      ? Math.round((regular * (skeleton.paidHours - STANDARD_MONTH)) / skeleton.paidHours / 1000) * 1000
      : null
  const fixedOther = skeleton.ordinal % 5 === 0 ? 18000 : null

  const baseSalary =
    regular - (fixedOvertime ?? 0) - (carAllowance ?? 0) - (fixedOther ?? 0)
  if (baseSalary <= 0) {
    throw new Error(
      `Employee ${skeleton.ordinal}: fixed extras exceed regluleg laun (${regular})`,
    )
  }

  return {
    baseSalary,
    additionalFixedOvertime: fixedOvertime,
    additionalFixedCarAllowance: carAllowance,
    additionalFixedOther: fixedOther,
    // Aukagreiðslur — must not affect reglulegt tímakaup.
    bonusOccasionalOvertime: skeleton.ordinal % 3 === 0 ? 45000 : null,
    bonusOccasionalCarAllowance: skeleton.ordinal % 7 === 0 ? 12500 : null,
    bonusOther: skeleton.ordinal % 4 === 0 ? 60000 : null,
    hourlyWage: getRegularHourlyWage({
      paidHours: skeleton.paidHours,
      baseSalary,
      additionalSalary:
        (fixedOvertime ?? 0) + (carAllowance ?? 0) + (fixedOther ?? 0),
    }),
  }
}

const buildCohort = (
  company: CompanySpec,
  skeleton: Skeleton[],
  knob: number,
): Employee[] => {
  const residuals = baselineResiduals(
    skeleton.length,
    company.residualSigma,
    company.seed + 1,
  )

  const genderShift =
    company.tune === 'genderShift' ? knob : (company.baseGenderShift ?? 0)
  const injectionScale = company.tune === 'injection' ? knob : 1

  const shiftByOrdinal = new Map<number, number>()
  for (const injection of company.injections ?? []) {
    injectionTargets(skeleton, injection).forEach((ordinal, i) => {
      const sign = injection.alternate && i % 2 === 1 ? -1 : 1
      shiftByOrdinal.set(ordinal, injection.shift * injectionScale * sign)
    })
  }

  return skeleton.map((row, index) => {
    // NEUTRAL is bundled with FEMALE everywhere the engine looks, so the model
    // shifts it the same way — otherwise the planted gap would not be the gap
    // the engine measures.
    const isFemaleSide = row.gender !== GenderEnum.MALE
    const logWage =
      A_INTERCEPT +
      B_SLOPE * row.score +
      (isFemaleSide ? -genderShift : 0) +
      residuals[index] +
      (shiftByOrdinal.get(row.ordinal) ?? 0)

    return { ...row, ...composePay(row, Math.exp(logWage)) }
  })
}

const decompositionOf = (cohort: Employee[]): WageGapDecompositionSnapshot =>
  roundWageGapDecompositionSnapshot(
    computeWageGapDecomposition({
      employees: cohort.map((e) => ({
        ordinal: e.ordinal,
        gender: e.gender,
        score: e.score,
        hourlyWage: e.hourlyWage,
      })),
      benchmarkPercent: BENCHMARK_PERCENT,
    }),
  )

/**
 * Bisect the company's knob until `oskyrtPercent` lands on target.
 *
 * `oskyrtPercent` is a magnitude with a separate direction, so the bisection
 * works on a SIGNED objective: the percentage negated when the gap runs í óhag
 * karla. Without that, a knob that overshoots through zero reads as an
 * improvement and the search converges on the wrong side.
 */
const calibrate = (company: CompanySpec, skeleton: Skeleton[]): number => {
  const signedOskyrt = (knob: number): number => {
    const snapshot = decompositionOf(buildCohort(company, skeleton, knob))
    const percent = snapshot.oskyrtPercent ?? 0
    return snapshot.oskyrtDirection === WageGapDirectionEnum.MALE
      ? -percent
      : percent
  }

  let low = 0
  let high = company.tune === 'genderShift' ? 0.4 : 4
  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2
    if (signedOskyrt(mid) < company.targetOskyrtPercent) low = mid
    else high = mid
  }
  return (low + high) / 2
}

// ── Workbook writing ────────────────────────────────────────────────────────
const toArrayBuffer = (buf: Buffer): ArrayBuffer =>
  buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer

/**
 * The template asset itself, read from disk rather than through the
 * `TEMPLATE_BASE64` constant.
 *
 * Two reasons. The constant is an 886KB base64 string that `report-excel`'s
 * index deliberately does not re-export, because `export *` from an index puts
 * it in every consumer of that subpath. And the xlsx is the source of truth
 * regardless: `refresh-template-data.js` generates the constant FROM this file,
 * so reading the asset cannot produce workbooks that are stale against a
 * constant nobody has regenerated.
 */
const TEMPLATE_PATH = join(
  __dirname,
  '..',
  '..',
  '..',
  'libs',
  'directorate-of-equality',
  'modules',
  'src',
  'report-excel',
  'template.xlsx',
)

const templateBuffer = (): Buffer => readFileSync(TEMPLATE_PATH)

const loadTemplate = async (): Promise<ExcelJS.Workbook> => {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(toArrayBuffer(templateBuffer()))
  return wb
}

type WorksheetModelWithTables = ExcelJS.Worksheet['model'] & {
  tables?: Array<{ style?: ExcelJS.TableStyleProperties | null }>
}

/**
 * Surfaces as `Cannot read properties of null (reading 'theme')` from
 * `writeBuffer()`. Named here because the message points at themes and the
 * cause is a null table style loaded off the template.
 */
const normaliseTableStyles = (wb: ExcelJS.Workbook): void => {
  for (const ws of wb.worksheets) {
    for (const table of (ws.model as WorksheetModelWithTables).tables ?? []) {
      table.style ??= {
        showFirstColumn: false,
        showLastColumn: false,
        showRowStripes: false,
        showColumnStripes: false,
      }
    }
  }
}

/** xlsx is a zip; every valid file starts with `PK\x03\x04`. */
const isValidXlsx = (buf: Buffer): boolean =>
  buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04

/**
 * Re-attach the template's own `docProps/custom.xml` — copied out of the
 * template archive rather than hard-coded, so the workbook carries the exact
 * `TemplateId` / `TemplateVersion` the shipped file does.
 *
 * This is what puts the generated files on tier 1 of `checkTemplateVersion`
 * rather than on the `Leiðbeiningar!C4` fallback, which is where an
 * exceljs-written workbook would otherwise land.
 */
const reinjectTemplateProps = async (buf: Buffer): Promise<Buffer> => {
  const templateZip = await JSZip.loadAsync(templateBuffer())
  const props = templateZip.file('docProps/custom.xml')
  if (!props) {
    throw new Error('template.xlsx carries no docProps/custom.xml to re-inject')
  }
  const zip = await JSZip.loadAsync(buf)
  zip.file('docProps/custom.xml', await props.async('string'))
  // ⚠️ DEFLATE explicitly: JSZip defaults to STORE, which re-emitted these
  // workbooks at ~9MB against the template's 647KB — under the importer's 20MB
  // upload cap, but only just, and pointlessly close to it.
  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}

const serialize = async (wb: ExcelJS.Workbook): Promise<Buffer> => {
  normaliseTableStyles(wb)
  for (let attempt = 0; attempt < 3; attempt++) {
    const buf = Buffer.from((await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer)
    if (isValidXlsx(buf)) return reinjectTemplateProps(buf)
  }
  throw new Error('exceljs writeBuffer produced an invalid xlsx after 3 attempts')
}

/**
 * Fill the five parsed sheets.
 *
 * ⚠️ `Undirviðmið` ships `Skilgreining` (E), `Fjöldi þrepa` (G) and the
 * `Þrep 1…8` columns (J–Q) as catalog-lookup FORMULAS. exceljs does not
 * evaluate formulas, and the parser rejects a formula with no cached result
 * ("Reiturinn inniheldur formúlu án reiknaðs gildis"), so these are written as
 * literals — the same thing `workbook.parser.spec.ts` does, and what the cells
 * would hold after Excel recalculated them anyway.
 */
const fillWorkbook = (wb: ExcelJS.Workbook, company: CompanySpec, cohort: Employee[]): void => {
  const criteria = wb.getWorksheet(SHEETS.CRITERIA)
  if (!criteria) throw new Error(`Missing sheet ${SHEETS.CRITERIA}`)
  for (const { row, weight } of JOB_CRITERIA) {
    criteria.getCell(`E${row}`).value = weight
  }
  // Row 10 is the template's blank Einstaklingsbundið slot.
  criteria.getCell('C10').value = PERSONAL_CRITERION.title
  criteria.getCell('D10').value = PERSONAL_CRITERION.description
  criteria.getCell('E10').value = PERSONAL_CRITERION.weight

  const subs = wb.getWorksheet(SHEETS.SUB_CRITERIA)
  if (!subs) throw new Error(`Missing sheet ${SHEETS.SUB_CRITERIA}`)
  const allSubs = [...JOB_SUBS, PERSONAL_SUB]
  allSubs.forEach((sub, index) => {
    const r = 6 + index
    subs.getCell(`B${r}`).value = sub.parent
    subs.getCell(`C${r}`).value = sub.title
    subs.getCell(`E${r}`).value = sub.description
    subs.getCell(`F${r}`).value = sub.weight
    subs.getCell(`G${r}`).value = sub.steps
    // Þrep 1 is column J = index 10.
    stepLabels(sub.steps).forEach((label, i) => {
      subs.getCell(r, 10 + i).value = label
    })
  })

  const employees = wb.getWorksheet(SHEETS.EMPLOYEES)
  if (!employees) throw new Error(`Missing sheet ${SHEETS.EMPLOYEES}`)
  for (const e of cohort) {
    const r = 5 + e.ordinal
    employees.getCell(`B${r}`).value = e.name
    employees.getCell(`C${r}`).value = e.role.title
    employees.getCell(`D${r}`).value = GENDER_ENUM_TO_DISPLAY[e.gender]
    employees.getCell(`E${r}`).value = e.paidHours
    employees.getCell(`F${r}`).value = e.role.field
    employees.getCell(`G${r}`).value = e.role.department
    employees.getCell(`H${r}`).value = e.startDate
    employees.getCell(`I${r}`).value = e.baseSalary
    employees.getCell(`J${r}`).value = e.additionalFixedOvertime
    employees.getCell(`K${r}`).value = e.additionalFixedCarAllowance
    employees.getCell(`L${r}`).value = e.additionalFixedOther
    employees.getCell(`M${r}`).value = e.bonusOccasionalOvertime
    employees.getCell(`N${r}`).value = e.bonusOccasionalCarAllowance
    employees.getCell(`O${r}`).value = e.bonusOther
  }

  // Starfsmat: one row per DISTINCT role in Launagögn first-appearance order,
  // step inputs on every second column from G (a computed Stig column is
  // interleaved after each) — the ROLE_STEP_INPUTS geometry.
  const roleSheet = wb.getWorksheet(SHEETS.ROLE_CLASSIFICATION)
  if (!roleSheet) throw new Error(`Missing sheet ${SHEETS.ROLE_CLASSIFICATION}`)
  company.roles.forEach((role, roleIndex) => {
    role.steps.forEach((step, subIndex) => {
      roleSheet.getCell(11 + roleIndex, 7 + 2 * subIndex).value = step
    })
  })

  // Einstaklingsmat: one row per employee in ordinal order, personal-sub
  // inputs from column F — the EMP_STEP_INPUTS geometry.
  const personalSheet = wb.getWorksheet(SHEETS.EMPLOYEE_CLASSIFICATION)
  if (!personalSheet) throw new Error(`Missing sheet ${SHEETS.EMPLOYEE_CLASSIFICATION}`)
  cohort.forEach((e, index) => {
    personalSheet.getCell(11 + index, 6).value = e.personalStep
  })
}

// ── Reporting ───────────────────────────────────────────────────────────────
const fmt = (n: number | null | undefined, digits = 2): string =>
  n === null || n === undefined ? '—' : n.toFixed(digits)

const summarise = (
  company: CompanySpec,
  cohort: Employee[],
  snapshot: WageGapDecompositionSnapshot,
): string[] => {
  const dispersion = computePayDispersion(snapshot)
  const scores = cohort.map((e) => e.score)
  const wages = cohort.map((e) => e.hourlyWage)
  const minimumSet = snapshot.employees.filter((e) => e.inMinimumSet)
  // Printed even when nothing is listed: on company 1 the whole design rests
  // on the margin between the largest |t| and the threshold, and a run that
  // silently crept over 2 would change what that file demonstrates.
  const maxT = Math.max(
    ...studentizedResiduals(snapshot).map((r) => Math.abs(r.studentizedResidual)),
  )
  const fullTime = cohort.filter((e) => e.paidHours >= STANDARD_MONTH)
  const monthly = fullTime.map(
    (e) =>
      e.baseSalary +
      (e.additionalFixedOvertime ?? 0) +
      (e.additionalFixedCarAllowance ?? 0) +
      (e.additionalFixedOther ?? 0),
  )

  return [
    `  starfsmenn        ${cohort.length} (karlar ${snapshot.counts.male} / konur+kynsegin ${snapshot.counts.female})`,
    `  stig              ${fmt(Math.min(...scores), 1)} – ${fmt(Math.max(...scores), 1)}`,
    `  tímakaup          ${Math.round(Math.min(...wages))} – ${Math.round(Math.max(...wages))} kr/klst`,
    `  regluleg laun     ${Math.round(Math.min(...monthly) / 1000)} – ${Math.round(Math.max(...monthly) / 1000)} þ.kr/mán (fullt starf)`,
    `  R²                ${fmt(snapshot.pooledFit?.rSquared ?? null, 3)}`,
    `  hæsta |t|         ${fmt(maxT)} (þröskuldur ${dispersion.threshold})`,
    `  óleiðréttur       ${fmt(snapshot.rawGapPercent)}% ${snapshot.rawGapDirection ?? ''}`,
    `  óskýrt (leiðr.)   ${fmt(snapshot.oskyrtPercent)}% ${snapshot.oskyrtDirection ?? ''} — innan viðmiðs: ${snapshot.oskyrtWithinBenchmark}`,
    `  lágmarksmengi     ${snapshot.minimumSetSize} af ${snapshot.gapCarrierCount} berendum, lokar bili: ${snapshot.minimumSetClosesGap}`,
    `    → raðnúmer      ${minimumSet.map((e) => `#${e.ordinal} (${e.gender === GenderEnum.MALE ? 'karl' : 'kona'}, ${e.deviationPercent > 0 ? '+' : ''}${fmt(e.deviationPercent, 1)}%)`).join(', ') || '—'}`,
    `  óskýrt eftir      ${fmt(gapPercentFromLog(snapshot.oskyrtLogAfterMinimumSet).percent)}%`,
    `  ábendingar        available: ${dispersion.available}, blockers: ${dispersion.blockers.join(',') || '—'}, population: ${dispersion.population}`,
    `    → skráðar       ${dispersion.employees.length} (pollur: ${dispersion.countBelowExpected} undir / ${dispersion.countAboveExpected} yfir)`,
    `    → raðnúmer      ${dispersion.employees.map((e) => `#${e.employeeOrdinal} (t=${fmt(e.studentizedResidual)}, ${e.deviationPercent > 0 ? '+' : ''}${fmt(e.deviationPercent, 1)}%)`).join(', ') || '—'}`,
    `  dreifing          +${fmt(dispersion.cohortResidualSpreadPercentUp, 1)}% / ${fmt(dispersion.cohortResidualSpreadPercentDown, 1)}%`,
    `  varnaðarorð       ${snapshot.warnings.join(', ') || '—'}`,
  ]
}

// ── Main ────────────────────────────────────────────────────────────────────
const outDir = process.argv[2] ?? join(homedir(), 'Downloads')

void (async () => {
  const lines: string[] = []

  for (const company of COMPANIES) {
    const skeleton = buildSkeleton(company)
    const knob = calibrate(company, skeleton)
    const cohort = buildCohort(company, skeleton, knob)
    const modelled = decompositionOf(cohort)

    const wb = await loadTemplate()
    fillWorkbook(wb, company, cohort)
    const buffer = await serialize(wb)

    // The real importer, on the real bytes. A workbook that would 400 on
    // upload must fail the run, not be written and discovered later.
    const parsed = await parseWorkbook(buffer)
    const stepScoreByKey = assertParsedPayloadIntegrity(parsed)
    const parsedScores = computeEmployeeScores(parsed, stepScoreByKey)
    const reparsed = roundWageGapDecompositionSnapshot(
      computeWageGapDecomposition({
        employees: parsed.employees.map((e, i) => ({
          ordinal: e.ordinal,
          gender: e.gender,
          score: parsedScores[i],
          hourlyWage: getRegularHourlyWage({
            paidHours: e.paidHours,
            baseSalary: e.baseSalary,
            additionalSalary:
              (e.additionalFixedOvertime ?? 0) +
              (e.additionalFixedCarAllowance ?? 0) +
              (e.additionalFixedOther ?? 0),
          }),
        })),
        benchmarkPercent: BENCHMARK_PERCENT,
      }),
    )

    // The whole point of round-tripping: the figures printed below must be the
    // ones the API will compute off this file, not the ones the model intended.
    if (
      reparsed.oskyrtPercent !== modelled.oskyrtPercent ||
      reparsed.minimumSetSize !== modelled.minimumSetSize
    ) {
      throw new Error(
        `${company.slug}: re-parsed figures differ from the model ` +
          `(óskýrt ${modelled.oskyrtPercent} → ${reparsed.oskyrtPercent}, ` +
          `lágmarksmengi ${modelled.minimumSetSize} → ${reparsed.minimumSetSize})`,
      )
    }

    const path = join(outDir, `launagreining-2.0-${company.slug}.xlsx`)
    writeFileSync(path, buffer)

    lines.push(
      '',
      `${company.label}`,
      `  skrá              ${path}`,
      `  stilliþáttur      ${company.tune} = ${knob.toFixed(6)}`,
      ...summarise(company, cohort, reparsed),
    )
  }

  // eslint-disable-next-line no-console
  console.log(lines.join('\n'))
})()
