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
 *   `Foreldra viðmið` references a parent criterion title; `Fjöldi þrepa`
 *   fixes the number of steps (1–10), and columns `Þrep 1` … `Þrep 10`
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
  SHEETS,
  TABLE_FIRST_DATA_ROW,
} from '../workbook.schema'
import { readInteger, readNumber, readString } from './cell'
import { ErrorBag } from './errors'

const CRITERIA_COLS = {
  tegund: 'B',
  title: 'C',
  description: 'D',
  weight: 'E',
} as const

const SUB_CRITERIA_COLS = {
  parent: 'B',
  title: 'C',
  description: 'D',
  weight: 'E',
  numSteps: 'F',
  // Cols G/H/I are computed formulas (Tegund, Hámarksstig, Samsumma OK?).
  // Þrep 1 is column J = 1-based index 10; Þrep N is column J+N−1.
  firstStepCol: 10,
} as const

const MAX_STEPS = 10
const MAX_DATA_ROWS = 40

/**
 * Read Viðmið sheet → list of top-level criteria (no sub-criteria attached
 * yet — those come from Undirviðmið in a second pass). Empty rows (no title
 * and no weight) are skipped; they exist in the template as placeholder
 * slots for employer-added personal criteria.
 */
const parseCriteriaSheet = (
  sheet: ExcelJS.Worksheet,
  errors: ErrorBag,
): ParsedCriterionDto[] => {
  const criteria: ParsedCriterionDto[] = []

  for (
    let r = TABLE_FIRST_DATA_ROW;
    r < TABLE_FIRST_DATA_ROW + MAX_DATA_ROWS;
    r++
  ) {
    const tegund = readString(sheet.getCell(`${CRITERIA_COLS.tegund}${r}`))
    const title = readString(sheet.getCell(`${CRITERIA_COLS.title}${r}`))
    const description = readString(
      sheet.getCell(`${CRITERIA_COLS.description}${r}`),
    )
    const weight = readNumber(sheet.getCell(`${CRITERIA_COLS.weight}${r}`))

    // Only Tegund values matching the two known buckets are treated as data
    // rows. Anything else (bullet-point help text below the table, blank
    // rows, merged header text) is skipped silently — the table has no
    // row-number guard on Viðmið, so Tegund is our only reliable signal.
    const isDataRow =
      tegund === CRITERION_TEGUND.JOB_BASED ||
      tegund === CRITERION_TEGUND.PERSONAL
    if (!isDataRow) continue

    // Empty Persónubundinn slots are expected — the template ships with
    // blank rows employers may fill in later. Skip silently.
    if (tegund === CRITERION_TEGUND.PERSONAL && !title) continue

    if (!title || !description || weight == null) {
      errors.add(
        SHEETS.CRITERIA,
        'Row is missing title, description, or weight',
        {
          row: r,
        },
      )
      continue
    }

    const type = resolveCriterionType(tegund, title, r, errors)
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
 * - Starfsbundinn rows MUST have a title from the closed set Ábyrgð / Álag /
 *   Vinnuaðstæður / Hæfni. Anything else is an error — Jafnréttisstofa
 *   controls these titles.
 * - Persónubundinn rows always resolve to `PERSONAL`, regardless of title.
 */
const resolveCriterionType = (
  tegund: string,
  title: string,
  row: number,
  errors: ErrorBag,
): ReportCriterionTypeEnum | null => {
  if (tegund === CRITERION_TEGUND.JOB_BASED) {
    const mapped = JOB_BASED_TITLE_TO_TYPE[title]
    if (!mapped) {
      errors.add(
        SHEETS.CRITERIA,
        `Unknown job-based criterion "${title}" — expected one of: ${Object.keys(JOB_BASED_TITLE_TO_TYPE).join(', ')}`,
        { row, column: CRITERIA_COLS.title },
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
    `Unknown Tegund "${tegund}" — expected "${CRITERION_TEGUND.JOB_BASED}" or "${CRITERION_TEGUND.PERSONAL}"`,
    { row, column: CRITERIA_COLS.tegund },
  )
  return null
}

/**
 * Read Undirviðmið sheet → list of sub-criteria, attach each to its parent
 * criterion by title lookup. Step descriptions read from the first
 * `numSteps` columns; any extras are ignored. Step scores computed here.
 */
const parseSubCriteriaSheet = (
  sheet: ExcelJS.Worksheet,
  criteria: ParsedCriterionDto[],
  errors: ErrorBag,
): void => {
  const criterionByTitle = new Map(criteria.map((c) => [c.title, c]))

  for (
    let r = TABLE_FIRST_DATA_ROW;
    r < TABLE_FIRST_DATA_ROW + MAX_DATA_ROWS;
    r++
  ) {
    const parentTitle = readString(
      sheet.getCell(`${SUB_CRITERIA_COLS.parent}${r}`),
    )
    const title = readString(sheet.getCell(`${SUB_CRITERIA_COLS.title}${r}`))
    const description = readString(
      sheet.getCell(`${SUB_CRITERIA_COLS.description}${r}`),
    )
    const weight = readNumber(sheet.getCell(`${SUB_CRITERIA_COLS.weight}${r}`))
    const numSteps = readInteger(
      sheet.getCell(`${SUB_CRITERIA_COLS.numSteps}${r}`),
    )

    if (!parentTitle && !title && !weight && !numSteps) continue

    if (
      !parentTitle ||
      !title ||
      !description ||
      weight == null ||
      numSteps == null
    ) {
      errors.add(
        SHEETS.SUB_CRITERIA,
        'Row is missing parent, title, description, weight, or step count',
        {
          row: r,
        },
      )
      continue
    }

    if (numSteps < 1 || numSteps > MAX_STEPS) {
      errors.add(
        SHEETS.SUB_CRITERIA,
        `Step count ${numSteps} out of range 1–${MAX_STEPS}`,
        { row: r, column: SUB_CRITERIA_COLS.numSteps },
      )
      continue
    }

    const parent = criterionByTitle.get(parentTitle)
    if (!parent) {
      errors.add(
        SHEETS.SUB_CRITERIA,
        `Parent criterion "${parentTitle}" not found on ${SHEETS.CRITERIA}`,
        { row: r, column: SUB_CRITERIA_COLS.parent },
      )
      continue
    }

    const steps: ParsedSubCriterionStepDto[] = []
    for (let i = 1; i <= numSteps; i++) {
      const descCell = sheet.getCell(r, SUB_CRITERIA_COLS.firstStepCol + i - 1)
      const stepDesc = readString(descCell)
      if (!stepDesc) {
        errors.add(SHEETS.SUB_CRITERIA, `Missing description for step ${i}`, {
          row: r,
          column: descCell.address.replace(/\d+$/, ''),
        })
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
  }
}

export const parseCriteriaTree = (
  workbook: ExcelJS.Workbook,
  errors: ErrorBag,
): ParsedCriterionDto[] => {
  const viðmiðSheet = workbook.getWorksheet(SHEETS.CRITERIA)
  const undirviðmiðSheet = workbook.getWorksheet(SHEETS.SUB_CRITERIA)
  if (!viðmiðSheet) {
    errors.add(
      SHEETS.CRITERIA,
      `Required sheet "${SHEETS.CRITERIA}" is missing`,
    )
    return []
  }
  if (!undirviðmiðSheet) {
    errors.add(
      SHEETS.SUB_CRITERIA,
      `Required sheet "${SHEETS.SUB_CRITERIA}" is missing`,
    )
    return []
  }

  const criteria = parseCriteriaSheet(viðmiðSheet, errors)
  parseSubCriteriaSheet(undirviðmiðSheet, criteria, errors)
  return criteria
}
