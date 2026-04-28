/**
 * Parser constants for the salary-report Excel template.
 *
 * The template itself is a hand-authored xlsx (`template.xlsx`) shipped as a
 * static asset. This file does NOT describe the template's layout — it
 * captures only what the parser needs to walk the template reliably:
 *
 * - **Named ranges**: stable anchors (`VIDMID_TABLE`, `SUB_PARENT`, etc.) the
 *   parser reads instead of hard-coded cell addresses. These survive minor
 *   hand-edits (row inserts, column resizes) far better than A1 refs.
 * - **Sheet names**: the Icelandic tab labels the workbook ships with.
 * - **Translation maps**: Icelandic display strings ↔ internal enums. The
 *   template exposes Icelandic to users ("Karl", "Grunnskólapróf", …); the
 *   API contract exposes enums (`MALE`, `COMPULSORY`, …). One translation
 *   layer, both directions, defined here.
 * - **Score formula**: the canonical derivation of a step's numeric score
 *   from `(stepOrder, numSteps, subWeightPct)`. Server always computes this
 *   — never user-input.
 *
 * Anything describing layout (row counts, column widths, validation bounds,
 * header text) lives in the xlsx, not here.
 */

import { GenderEnum, ReportTypeEnum } from '../report/models/report.model'
import { ReportCriterionTypeEnum } from '../report-criterion/models/report-criterion.model'
import { EducationEnum } from '../report-employee/models/report-employee.model'

/**
 * Factor mapping a sub-criterion's weight percent to its max score.
 *
 *   max_score(sub)          = sub.weightPct × SCORE_FACTOR
 *   step_score(sub, order)  = (order / sub.numSteps) × max_score(sub)
 *
 * Derived from the UI convention "10% = 100 stig": a criterion with 10%
 * weight can contribute up to 100 points, so a full report (100% total
 * weight) sums to 1000 points max.
 */
export const SCORE_FACTOR = 10

export const computeStepScore = (
  stepOrder: number,
  numSteps: number,
  subWeightPct: number,
): number => (stepOrder / numSteps) * subWeightPct * SCORE_FACTOR

/**
 * Sheet names the template ships with. Keyed in English for code, valued in
 * Icelandic to match the file. `IGNORE` sheets are not parsed.
 */
export const SHEETS = {
  INSTRUCTIONS: 'Leiðbeiningar',
  CRITERIA: 'Viðmið',
  SUB_CRITERIA: 'Undirviðmið',
  EMPLOYEES: 'Starfsmenn',
  ROLE_CLASSIFICATION: 'Flokkun starfa',
  EMPLOYEE_CLASSIFICATION: 'Flokkun starfsmanna',
  OVERVIEW: 'Yfirlit',
} as const

export const IGNORED_SHEETS: ReadonlySet<string> = new Set([
  SHEETS.INSTRUCTIONS,
  SHEETS.OVERVIEW,
])

/**
 * Named ranges defined in the template. The parser should look these up by
 * name on the loaded workbook rather than hard-coding cell addresses — the
 * named ranges are the template's stable contract.
 */
export const NAMED_RANGES = {
  SCALE: 'KVARDI',
  CRITERIA_TABLE: 'VIDMID_TABLE',
  CRITERIA_NAMES: 'VIDMID_NAMES',
  SUB_PARENT: 'SUB_PARENT',
  SUB_NAME: 'SUB_NAME',
  SUB_WEIGHT: 'SUB_WEIGHT',
  SUB_NSTEPS: 'SUB_NSTEPS',
  SUB_TYPE: 'SUB_TYPE',
  EMPLOYEE_NUMBER: 'EMP_NUM',
  EMPLOYEE_NAME: 'EMP_NAME',
  EMPLOYEE_JOB: 'EMP_JOB',
  EMPLOYEE_GENDER: 'EMP_KYN',
  JOB_TITLES: 'JOB_TITLES',
  JOB_TOTALS: 'JOB_TOTALS',
} as const

/**
 * Header row number (1-based) for table-layout sheets. Row 2 is the sheet
 * title, row 3 is instructional text, row 4 is blank, row 5 is headers,
 * rows 6+ are data.
 */
export const TABLE_HEADER_ROW = 5
export const TABLE_FIRST_DATA_ROW = 6

/** Report type this template supports. (Equality reports use a different flow.) */
export const TEMPLATE_REPORT_TYPE = ReportTypeEnum.SALARY

/**
 * The four mandatory job-based criterion types every submission must contain.
 * Enforced by the semantic validator: rejects if any is missing from the
 * Viðmið sheet. Identified by enum value, not by title (titles are localized
 * user-facing strings and could drift).
 */
export const MANDATORY_JOB_BASED_CRITERIA: readonly ReportCriterionTypeEnum[] =
  [
    ReportCriterionTypeEnum.RESPONSIBILITY,
    ReportCriterionTypeEnum.STRAIN,
    ReportCriterionTypeEnum.CONDITION,
    ReportCriterionTypeEnum.COMPETENCE,
  ]

/**
 * Top-level criterion "Tegund" column values (`Starfsbundinn` / `Persónubundinn`)
 * split criteria into two buckets. Job-based rows also carry a specific title
 * that maps to one of the four mandatory enum types; personal rows carry free
 * text titles and always resolve to `PERSONAL`.
 */
export const CRITERION_TEGUND = {
  JOB_BASED: 'Starfsbundinn',
  PERSONAL: 'Persónubundinn',
} as const

/**
 * Icelandic title → enum mapping for the four mandatory job-based criteria.
 * Missing a key here means the parser will reject the row as an unrecognised
 * job-based criterion title — exactly what we want, since Jafnréttisstofa
 * defines these titles and the employer cannot invent new ones.
 */
export const JOB_BASED_TITLE_TO_TYPE: Readonly<
  Record<string, ReportCriterionTypeEnum>
> = {
  Ábyrgð: ReportCriterionTypeEnum.RESPONSIBILITY,
  Álag: ReportCriterionTypeEnum.STRAIN,
  Vinnuaðstæður: ReportCriterionTypeEnum.CONDITION,
  Hæfni: ReportCriterionTypeEnum.COMPETENCE,
}

export const TYPE_TO_JOB_BASED_TITLE: Readonly<
  Record<ReportCriterionTypeEnum, string | undefined>
> = Object.entries(JOB_BASED_TITLE_TO_TYPE).reduce(
  (acc, [title, type]) => ({ ...acc, [type]: title }),
  {} as Record<ReportCriterionTypeEnum, string>,
)

/** Icelandic gender display ↔ `GenderEnum`. */
export const GENDER_DISPLAY_TO_ENUM: Readonly<Record<string, GenderEnum>> = {
  Karl: GenderEnum.MALE,
  Kona: GenderEnum.FEMALE,
  Hlutlaust: GenderEnum.NEUTRAL,
}

export const GENDER_ENUM_TO_DISPLAY: Readonly<Record<GenderEnum, string>> = {
  [GenderEnum.MALE]: 'Karl',
  [GenderEnum.FEMALE]: 'Kona',
  [GenderEnum.NEUTRAL]: 'Hlutlaust',
}

/**
 * Icelandic education display ↔ `EducationEnum`. Keys match the template's
 * dropdown list exactly; diacritics and slashes are significant (comparison
 * is string-equal after trim, no normalisation).
 */
export const EDUCATION_DISPLAY_TO_ENUM: Readonly<
  Record<string, EducationEnum>
> = {
  Grunnskólapróf: EducationEnum.COMPULSORY,
  'Framhaldsskóla-/stúdentspróf': EducationEnum.UPPER_SECONDARY,
  'Iðn-/starfsmenntun': EducationEnum.VOCATIONAL,
  'Háskólapróf (BA/BS)': EducationEnum.BACHELOR,
  'Meistarapróf (MA/MS)': EducationEnum.MASTER,
  Doktorspróf: EducationEnum.DOCTORATE,
  Sérfræðinám: EducationEnum.PROFESSIONAL,
}

export const EDUCATION_ENUM_TO_DISPLAY: Readonly<
  Record<EducationEnum, string>
> = Object.entries(EDUCATION_DISPLAY_TO_ENUM).reduce(
  (acc, [display, enumVal]) => ({ ...acc, [enumVal]: display }),
  {} as Record<EducationEnum, string>,
)
