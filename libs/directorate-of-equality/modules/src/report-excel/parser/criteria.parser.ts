/**
 * Parses the Viðmið + Undirviðmið sheets into an in-memory criterion tree.
 *
 * The template's criterion structure is two sheets deep:
 *
 * - **Viðmið** (top-level): one row per criterion. Each row carries `Tegund`
 *   (JOB_BASED / PERSONAL), `Viðmið` (title), `Lýsing` (description), `Vægi`
 *   (weight percent). Job-based rows are locked-down Jafnréttisstofa
 *   categories (Ábyrgð, Álag, Vinnuaðstæður, Hæfni); personal rows are
 *   employer-named.
 *
 * - **Undirviðmið** (sub-level + steps): one row per sub-criterion.
 *   `Yfirviðmið` references a parent criterion title; `Fjöldi þrepa`
 *   fixes the number of steps (2–8), and columns `Þrep 1` … `Þrep 8`
 *   carry the step descriptions (only the first `numSteps` are read).
 *
 * Step scores are not stored in the workbook — they are computed here via
 * {@link computeStepScore} from `(stepOrder, numSteps, sub.weight)`. This
 * keeps the workbook smaller and guarantees the score matches the UI's
 * shown value exactly.
 */

import ExcelJS from 'exceljs'

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import {
  ParsedCriterionDto,
  ParsedSubCriterionDto,
  ParsedSubCriterionStepDto,
} from '../dto/parsed-report.dto'
import {
  computeStepScore,
  CRITERION_TEGUND,
  JOB_BASED_TITLE_TO_TYPE,
  MAX_STEPS,
  MIN_STEPS,
  NAMED_RANGES,
  SHEETS,
} from '../workbook.schema'
import {
  hasFormulaWithoutCachedResult,
  readInteger,
  readNumber,
  readString,
} from './cell'
import { ErrorBag } from './errors'

const SUB_CRITERIA_COLS = {
  parent: 'B',
  title: 'C',
  description: 'E',
  weight: 'F',
  numSteps: 'G',
  // Cols D/H/I are computed formulas (Tegund, Hámarksstig, Samsumma OK?).
  // Þrep 1 is column J = 1-based index 10; Þrep N is column J+N−1.
  firstStepCol: 10,
} as const

/**
 * Absolute ceiling on rows scanned per table sheet — a defensive guard against
 * malformed files reporting a huge `rowCount`, NOT a domain limit. Real
 * criteria / sub-criteria counts are capped far lower (and with explicit
 * errors) in `assertParsedPayloadIntegrity`; everything within this bound is
 * read in full — empty and non-data rows are skipped — so no data is ever
 * silently truncated the way the old fixed 40-row window did.
 */
const ABSOLUTE_MAX_TABLE_ROWS = 5000

type RectangularRange = {
  firstRow: number
  lastRow: number
  firstCol: number
  lastCol: number
}

/**
 * One sub-criterion, as the Flokkun matrices address it: by title, with the
 * step count that bounds a valid assignment.
 */
export type SubCriterionRef = {
  criterionTitle: string
  subTitle: string
  numSteps: number
}

/**
 * Sub-criteria in **Undirviðmið row order**, split into the two buckets the
 * classification matrices index by.
 *
 * ## Why this exists — the tree cannot supply it
 *
 * `Starfsmat` and `Einstaklingsmat` derive each step-input column from a
 * pointer formula on row 4:
 *
 * ```
 * Starfsmat!G4 = SMALL(IF(Undirviðmið!$D$6:$D$205="Starfsbundið",
 *                         ROW(Undirviðmið!$D$6:$D$205)-5), (COLUMN()-5)/2)
 * ```
 *
 * So **column pair N ↔ the Nth matching Undirviðmið row, in row order**.
 * Nothing groups by parent criterion. Walking `ParsedCriterionDto[]` and
 * flattening `subCriteria` produces a criterion-GROUPED order instead, which
 * only coincides with row order when the employer happens to have entered
 * their Undirviðmið rows sorted by the Viðmið criterion order. Nothing in the
 * template requires that, and a workbook that does not honour it had every
 * assignment read from the wrong column — silently where the shifted column's
 * step count was wide enough to accept the value.
 *
 * ## Reserved slots
 *
 * A `null` entry is a row the matrices DO allocate a column for (its
 * `Yfirviðmið` resolves, so the sheet's `Tegund` filter counts it) but which
 * failed validation, so there is no ref to assign against. Keeping the
 * placeholder preserves the position of every column after it; the upload
 * fails on the row's own error regardless, and swallowing the slot would bury
 * that error under a cascade of misattributed ones.
 */
export type SubCriteriaSheetOrder = {
  jobBased: (SubCriterionRef | null)[]
  personal: (SubCriterionRef | null)[]
}

export type ParsedCriteriaResult = {
  criteria: ParsedCriterionDto[]
  sheetOrder: SubCriteriaSheetOrder
}

/** `'AB'` → 28. */
const colToNum = (letters: string): number =>
  letters.split('').reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0)

/** 28 → `'AB'`. */
const numToCol = (n: number): string => {
  let col = ''
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) {
    col = String.fromCharCode(((x - 1) % 26) + 65) + col
  }
  return col
}

const readNamedRange = (
  workbook: ExcelJS.Workbook,
  definedName: string,
): RectangularRange | null => {
  const ranges = workbook.definedNames.getRanges(definedName)?.ranges
  if (!ranges || ranges.length !== 1) return null
  const m = ranges[0].match(/\$([A-Z]+)\$(\d+):\$([A-Z]+)\$(\d+)$/)
  if (!m) return null
  return {
    firstCol: colToNum(m[1]),
    firstRow: Number(m[2]),
    lastCol: colToNum(m[3]),
    lastRow: Number(m[4]),
  }
}

const addFormulaCacheError = (
  cell: ExcelJS.Cell,
  fieldLabel: string,
  errors: ErrorBag,
): void => {
  const row = Number(cell.address.match(/\d+$/)?.[0])
  errors.add(
    SHEETS.SUB_CRITERIA,
    `Reiturinn inniheldur formúlu án reiknaðs gildis fyrir „${fieldLabel}“ — opnaðu og vistaðu vinnubókina í Excel eða fylltu reitinn út handvirkt`,
    {
      row: Number.isFinite(row) ? row : undefined,
      column: cell.address.replace(/\d+$/, ''),
    },
  )
}

/**
 * Read Viðmið sheet → list of top-level criteria (no sub-criteria attached
 * yet — those come from Undirviðmið in a second pass). Empty rows (no title
 * and no weight) are skipped; they exist in the template as placeholder
 * slots for employer-added personal criteria.
 */
const parseCriteriaSheet = (
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  errors: ErrorBag,
): ParsedCriterionDto[] => {
  const criteria: ParsedCriterionDto[] = []
  const range = readNamedRange(workbook, NAMED_RANGES.CRITERIA_TABLE)
  if (!range || range.lastCol - range.firstCol < 2 || range.firstCol <= 1) {
    errors.add(
      SHEETS.CRITERIA,
      `Nafngreint svæði „${NAMED_RANGES.CRITERIA_TABLE}“ vantar eða er gallað`,
    )
    return criteria
  }

  const lastRow = Math.min(
    range.lastRow,
    range.firstRow + ABSOLUTE_MAX_TABLE_ROWS - 1,
  )
  const tegundCol = range.firstCol - 1
  const titleCol = range.firstCol
  const descriptionCol = range.firstCol + 1
  const weightCol = range.firstCol + 2
  for (let r = range.firstRow; r <= lastRow; r++) {
    const tegundCell = sheet.getCell(r, tegundCol)
    const titleCell = sheet.getCell(r, titleCol)
    const descriptionCell = sheet.getCell(r, descriptionCol)
    const weightCell = sheet.getCell(r, weightCol)
    const tegund = readString(tegundCell)
    const title = readString(titleCell)
    const description = readString(descriptionCell)
    const weight = readNumber(weightCell) ?? 0

    // Only Tegund values matching the two known buckets are treated as data
    // rows. Anything else (bullet-point help text below the table, blank
    // rows, merged header text) is skipped silently — the table has no
    // row-number guard on Viðmið, so Tegund is our only reliable signal.
    const isDataRow =
      tegund === CRITERION_TEGUND.JOB_BASED ||
      tegund === CRITERION_TEGUND.PERSONAL
    if (!isDataRow) continue

    // Empty Einstaklingsbundið slots are expected — the template ships with
    // blank rows employers may fill in later. Skip silently.
    if (tegund === CRITERION_TEGUND.PERSONAL && !title) continue

    if (!title || !description) {
      errors.add(SHEETS.CRITERIA, 'Röð vantar heiti eða lýsingu', {
        row: r,
      })
      continue
    }

    const type = resolveCriterionType(
      tegund,
      title,
      r,
      numToCol(titleCol),
      numToCol(tegundCol),
      errors,
    )
    if (!type) continue

    criteria.push({
      type,
      title,
      description,
      weight,
      subCriteria: [],
    })
  }

  return criteria
}

/**
 * Map a `(tegund, title)` pair to the internal `ReportCriterionTypeEnum`.
 *
 * - Starfsbundið rows MUST have a title from the closed set Ábyrgð / Álag /
 *   Vinnuaðstæður / Hæfni. Anything else is an error — Jafnréttisstofa
 *   controls these titles.
 * - Einstaklingsbundið rows always resolve to `PERSONAL`, regardless of title.
 */
const resolveCriterionType = (
  tegund: string,
  title: string,
  row: number,
  titleColumn: string,
  tegundColumn: string,
  errors: ErrorBag,
): ReportCriterionTypeEnum | null => {
  if (tegund === CRITERION_TEGUND.JOB_BASED) {
    const mapped = JOB_BASED_TITLE_TO_TYPE[title]
    if (!mapped) {
      errors.add(
        SHEETS.CRITERIA,
        `Óþekkt starfsbundið viðmið „${title}“ — reiknað var með einu af eftirfarandi: ${Object.keys(JOB_BASED_TITLE_TO_TYPE).join(', ')}`,
        { row, column: titleColumn },
      )
      return null
    }
    return mapped
  }
  if (tegund === CRITERION_TEGUND.PERSONAL) {
    return ReportCriterionTypeEnum.PERSONAL
  }
  errors.add(
    SHEETS.CRITERIA,
    `Óþekkt tegund „${tegund}“ — reiknað var með „${CRITERION_TEGUND.JOB_BASED}“ eða „${CRITERION_TEGUND.PERSONAL}“`,
    { row, column: tegundColumn },
  )
  return null
}

/**
 * Read Undirviðmið sheet → list of sub-criteria, attach each to its parent
 * criterion by title lookup. Step descriptions read from the first
 * `numSteps` columns; any extras are ignored. Step scores computed here.
 *
 * Also returns the Undirviðmið **row order** of the sub-criteria, split into
 * the two buckets the classification matrices index by — see
 * {@link SubCriteriaSheetOrder} for why the tree alone cannot supply it.
 */
const parseSubCriteriaSheet = (
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  criteria: ParsedCriterionDto[],
  errors: ErrorBag,
): SubCriteriaSheetOrder => {
  const sheetOrder: SubCriteriaSheetOrder = { jobBased: [], personal: [] }
  const criterionByTitle = new Map(criteria.map((c) => [c.title, c]))
  const range = readNamedRange(workbook, NAMED_RANGES.SUB_PARENT)
  if (!range) {
    errors.add(
      SHEETS.SUB_CRITERIA,
      `Nafngreint svæði „${NAMED_RANGES.SUB_PARENT}“ vantar eða er gallað`,
    )
    return sheetOrder
  }

  const lastRow = Math.min(
    range.lastRow,
    range.firstRow + ABSOLUTE_MAX_TABLE_ROWS - 1,
  )
  for (let r = range.firstRow; r <= lastRow; r++) {
    const parentCell = sheet.getCell(`${SUB_CRITERIA_COLS.parent}${r}`)
    const titleCell = sheet.getCell(`${SUB_CRITERIA_COLS.title}${r}`)
    const descriptionCell = sheet.getCell(
      `${SUB_CRITERIA_COLS.description}${r}`,
    )
    const weightCell = sheet.getCell(`${SUB_CRITERIA_COLS.weight}${r}`)
    const numStepsCell = sheet.getCell(`${SUB_CRITERIA_COLS.numSteps}${r}`)
    const parentTitle = readString(parentCell)
    const title = readString(titleCell)
    const description = readString(descriptionCell)
    const rawWeight = readNumber(weightCell)
    const weight = rawWeight ?? 0
    const numSteps = readInteger(numStepsCell)

    if (!parentTitle && !title && rawWeight == null && !numSteps) continue

    // Resolve the parent BEFORE any validation gate below can `continue`.
    // Whether this row occupies a column pair on the classification matrices
    // is decided by the parent alone (that is what Undirviðmið's computed
    // `Tegund` column looks up, and the matrices filter on `Tegund`), so a row
    // rejected further down still consumes its slot. `bucket` is the list that
    // slot belongs to; null means the row is not addressable at all.
    const parent = parentTitle ? criterionByTitle.get(parentTitle) : undefined
    const bucket = parent
      ? parent.type === ReportCriterionTypeEnum.PERSONAL
        ? sheetOrder.personal
        : sheetOrder.jobBased
      : null

    const missingRequiredFields = [
      { value: parentTitle, cell: parentCell, label: 'Yfirviðmið' },
      { value: title, cell: titleCell, label: 'Undirviðmið' },
      { value: description, cell: descriptionCell, label: 'Skilgreining' },
      { value: numSteps, cell: numStepsCell, label: 'Fjöldi þrepa' },
    ].filter((field) => field.value == null)

    if (missingRequiredFields.length > 0) {
      let hasPlainMissingFields = false
      for (const field of missingRequiredFields) {
        if (hasFormulaWithoutCachedResult(field.cell)) {
          addFormulaCacheError(field.cell, field.label, errors)
          continue
        }
        hasPlainMissingFields = true
      }

      if (hasPlainMissingFields) {
        errors.add(
          SHEETS.SUB_CRITERIA,
          'Röð vantar yfirviðmið, heiti, lýsingu eða fjölda þrepa',
          {
            row: r,
          },
        )
      }
      bucket?.push(null)
      continue
    }

    if (!parentTitle || !title || !description || numSteps == null) {
      errors.add(
        SHEETS.SUB_CRITERIA,
        'Röð vantar yfirviðmið, heiti, lýsingu eða fjölda þrepa',
        {
          row: r,
        },
      )
      bucket?.push(null)
      continue
    }

    const formulaWeightHasNoCachedResult =
      hasFormulaWithoutCachedResult(weightCell)
    if (formulaWeightHasNoCachedResult) {
      addFormulaCacheError(weightCell, 'Vægi', errors)
      bucket?.push(null)
      continue
    }

    if (numSteps < MIN_STEPS || numSteps > MAX_STEPS) {
      errors.add(
        SHEETS.SUB_CRITERIA,
        `Fjöldi þrepa ${numSteps} er utan leyfilegs bils ${MIN_STEPS}–${MAX_STEPS}`,
        { row: r, column: SUB_CRITERIA_COLS.numSteps },
      )
      bucket?.push(null)
      continue
    }

    if (!parent || !bucket) {
      errors.add(
        SHEETS.SUB_CRITERIA,
        `Yfirviðmið „${parentTitle}“ fannst ekki á blaðinu ${SHEETS.CRITERIA}`,
        { row: r, column: SUB_CRITERIA_COLS.parent },
      )
      continue
    }

    const steps: ParsedSubCriterionStepDto[] = []
    for (let i = 1; i <= numSteps; i++) {
      const descCell = sheet.getCell(r, SUB_CRITERIA_COLS.firstStepCol + i - 1)
      const stepDesc = readString(descCell)
      if (!stepDesc) {
        if (hasFormulaWithoutCachedResult(descCell)) {
          addFormulaCacheError(descCell, `Þrep ${i}`, errors)
        } else {
          errors.add(SHEETS.SUB_CRITERIA, `Lýsingu vantar fyrir þrep ${i}`, {
            row: r,
            column: descCell.address.replace(/\d+$/, ''),
          })
        }
        continue
      }
      steps.push({
        order: i,
        description: stepDesc,
        score: computeStepScore(i, numSteps, weight),
      })
    }

    const sub: ParsedSubCriterionDto = {
      title,
      description,
      weight,
      steps,
    }
    parent.subCriteria.push(sub)
    // `numSteps` as DECLARED in column G, not `steps.length`. The matrices'
    // own cell validation caps input at column G (`Starfsmat!G$8` etc.), so
    // matching it keeps the parser's step-range error consistent with what
    // Excel allowed the user to type. A row with a missing step description
    // has already been reported above, and reporting it a second time as an
    // out-of-range step would name a bound the user never saw.
    bucket.push({
      criterionTitle: parent.title,
      subTitle: title,
      numSteps,
    })
  }

  return sheetOrder
}

export const parseCriteriaTree = (
  workbook: ExcelJS.Workbook,
  errors: ErrorBag,
): ParsedCriteriaResult => {
  const empty: SubCriteriaSheetOrder = { jobBased: [], personal: [] }
  const viðmiðSheet = workbook.getWorksheet(SHEETS.CRITERIA)
  const undirviðmiðSheet = workbook.getWorksheet(SHEETS.SUB_CRITERIA)
  if (!viðmiðSheet) {
    errors.add(SHEETS.CRITERIA, `Nauðsynlegt blað „${SHEETS.CRITERIA}“ vantar`)
    return { criteria: [], sheetOrder: empty }
  }
  if (!undirviðmiðSheet) {
    errors.add(
      SHEETS.SUB_CRITERIA,
      `Nauðsynlegt blað „${SHEETS.SUB_CRITERIA}“ vantar`,
    )
    return { criteria: [], sheetOrder: empty }
  }

  const criteria = parseCriteriaSheet(workbook, viðmiðSheet, errors)
  const sheetOrder = parseSubCriteriaSheet(
    workbook,
    undirviðmiðSheet,
    criteria,
    errors,
  )
  return { criteria, sheetOrder }
}
