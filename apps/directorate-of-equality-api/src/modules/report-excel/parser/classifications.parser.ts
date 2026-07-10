/**
 * Parses the two "Flokkun" matrix sheets into step-assignment records that
 * attach onto roles (Flokkun starfa) and employees (Flokkun starfsmanna).
 *
 * ## Layout recap
 *
 * Both sheets are wide matrices. Their row/column semantics are **derived
 * from the raw-data sheets**, not read out of the matrix headers (which are
 * formulas we don't evaluate):
 *
 * - **Flokkun starfa**
 *   - Rows map 1:1 to distinct roles in the order they first appear on
 *     Starfsmenn.
 *   - Step-order columns hold one value per job-based sub-criterion in the
 *     order they appear on Undirviðmið (filtered to `type != PERSONAL`). A
 *     computed score column is interleaved after each, so inputs sit on every
 *     second column.
 *
 * - **Flokkun starfsmanna**
 *   - Rows map 1:1 to employees in ordinal order.
 *   - Step-order columns hold one value per personal sub-criterion, in the
 *     order personal subs appear on Undirviðmið (same every-second-column
 *     interleaving).
 *
 * The row/column geometry of each step-input region is read from the
 * `ROLE_STEP_INPUTS` / `EMP_STEP_INPUTS` named ranges (see
 * {@link readStepInputGrid}) rather than hard-coded — capacity is bounded by
 * what the template provisions and grows with it.
 *
 * Blank cells mean "no assignment" and are skipped. The semantic validator
 * (separate pass) enforces completeness — wrong place to do it here.
 */

import ExcelJS from 'exceljs'

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import {
  ParsedCriterionDto,
  ParsedEmployeeDto,
  ParsedRoleDto,
  ParsedStepAssignmentDto,
} from '../dto/parsed-report.dto'
import { NAMED_RANGES, SHEETS } from '../workbook.schema'
import { readInteger } from './cell'
import { ErrorBag } from './errors'

/**
 * Geometry of a classification matrix's step-input region, derived from a
 * template named range rather than hard-coded column letters.
 *
 * Step-order inputs occupy every SECOND column (a computed score column is
 * interleaved after each), starting at `firstCol` on `firstRow`. So input
 * column slot N lives at column `firstCol + 2·N`. Reading the geometry from
 * the named range means the supported role / employee / subcriterion counts
 * are bounded by what the template physically provisions, and grow if the
 * template does — no code change.
 */
type StepInputGrid = {
  firstRow: number
  lastRow: number
  firstCol: number
  lastCol: number
  rowCapacity: number
  columnPairCapacity: number
}

/** `'AB'` → 28. */
const colToNum = (letters: string): number =>
  letters
    .split('')
    .reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0)

/**
 * Parse a single rectangular named range (e.g. `'Flokkun starfa'!$G$11:$GX$110`)
 * into the step-input grid it describes. Returns null if the name is absent or
 * not a single `$COL$ROW:$COL$ROW` range — callers surface that as an error.
 */
const readStepInputGrid = (
  workbook: ExcelJS.Workbook,
  definedName: string,
): StepInputGrid | null => {
  const ranges = workbook.definedNames.getRanges(definedName)?.ranges
  if (!ranges || ranges.length !== 1) return null
  const m = ranges[0].match(/\$([A-Z]+)\$(\d+):\$([A-Z]+)\$(\d+)$/)
  if (!m) return null
  const firstCol = colToNum(m[1])
  const firstRow = Number(m[2])
  const lastCol = colToNum(m[3])
  const lastRow = Number(m[4])
  return {
    firstRow,
    lastRow,
    firstCol,
    lastCol,
    rowCapacity: lastRow - firstRow + 1,
    columnPairCapacity: Math.floor((lastCol - firstCol) / 2) + 1,
  }
}

type FlatSubRef = {
  criterionTitle: string
  subTitle: string
  numSteps: number
}

/**
 * Flatten the criterion tree into the two filtered lists the Flokkun sheets
 * index into. Order is preserved from the nested input — that's the same
 * order the sheets use.
 */
const flattenSubRefs = (
  criteria: ParsedCriterionDto[],
): { jobBased: FlatSubRef[]; personal: FlatSubRef[] } => {
  const jobBased: FlatSubRef[] = []
  const personal: FlatSubRef[] = []
  for (const c of criteria) {
    for (const s of c.subCriteria) {
      const ref: FlatSubRef = {
        criterionTitle: c.title,
        subTitle: s.title,
        numSteps: s.steps.length,
      }
      if (c.type === ReportCriterionTypeEnum.PERSONAL) {
        personal.push(ref)
      } else {
        jobBased.push(ref)
      }
    }
  }
  return { jobBased, personal }
}

const buildAssignment = (
  ref: FlatSubRef,
  stepOrder: number,
  sheetName: string,
  cellAddress: string,
  errors: ErrorBag,
): ParsedStepAssignmentDto | null => {
  if (
    !Number.isInteger(stepOrder) ||
    stepOrder < 1 ||
    stepOrder > ref.numSteps
  ) {
    errors.add(
      sheetName,
      `Þrep ${stepOrder} er utan leyfilegs bils 1–${ref.numSteps} fyrir undirviðmið „${ref.subTitle}“`,
      { column: cellAddress.replace(/\d+$/, '') },
    )
    return null
  }
  return {
    criterionTitle: ref.criterionTitle,
    subTitle: ref.subTitle,
    stepOrder,
  }
}

export const parseRoleClassifications = (
  workbook: ExcelJS.Workbook,
  criteria: ParsedCriterionDto[],
  roles: ParsedRoleDto[],
  errors: ErrorBag,
): void => {
  const sheet = workbook.getWorksheet(SHEETS.ROLE_CLASSIFICATION)
  if (!sheet) {
    errors.add(
      SHEETS.ROLE_CLASSIFICATION,
      `Nauðsynlegt blað „${SHEETS.ROLE_CLASSIFICATION}“ vantar`,
    )
    return
  }

  const { jobBased } = flattenSubRefs(criteria)

  const grid = readStepInputGrid(workbook, NAMED_RANGES.ROLE_STEP_INPUTS)
  if (!grid) {
    errors.add(
      SHEETS.ROLE_CLASSIFICATION,
      `Nafngreint svæði „${NAMED_RANGES.ROLE_STEP_INPUTS}“ vantar eða er gallað`,
    )
    return
  }

  if (roles.length > grid.rowCapacity) {
    errors.add(
      SHEETS.ROLE_CLASSIFICATION,
      `Að hámarki ${grid.rowCapacity} ólík störf eru studd; fjöldi var ${roles.length}`,
    )
    return
  }

  if (jobBased.length > grid.columnPairCapacity) {
    errors.add(
      SHEETS.ROLE_CLASSIFICATION,
      `Að hámarki ${grid.columnPairCapacity} starfsbundin undirviðmið eru studd; fjöldi var ${jobBased.length}`,
    )
    return
  }

  roles.forEach((role, roleIdx) => {
    const row = grid.firstRow + roleIdx
    jobBased.forEach((ref, subIdx) => {
      const col = grid.firstCol + 2 * subIdx
      const cell = sheet.getCell(row, col)
      const stepOrder = readInteger(cell)
      if (stepOrder == null) return
      const assignment = buildAssignment(
        ref,
        stepOrder,
        SHEETS.ROLE_CLASSIFICATION,
        cell.address,
        errors,
      )
      if (assignment) role.stepAssignments.push(assignment)
    })
  })
}

export const parseEmployeeClassifications = (
  workbook: ExcelJS.Workbook,
  criteria: ParsedCriterionDto[],
  employees: ParsedEmployeeDto[],
  errors: ErrorBag,
): void => {
  const sheet = workbook.getWorksheet(SHEETS.EMPLOYEE_CLASSIFICATION)
  if (!sheet) {
    errors.add(
      SHEETS.EMPLOYEE_CLASSIFICATION,
      `Nauðsynlegt blað „${SHEETS.EMPLOYEE_CLASSIFICATION}“ vantar`,
    )
    return
  }

  const { personal } = flattenSubRefs(criteria)

  const grid = readStepInputGrid(workbook, NAMED_RANGES.EMP_STEP_INPUTS)
  if (!grid) {
    errors.add(
      SHEETS.EMPLOYEE_CLASSIFICATION,
      `Nafngreint svæði „${NAMED_RANGES.EMP_STEP_INPUTS}“ vantar eða er gallað`,
    )
    return
  }

  if (employees.length > grid.rowCapacity) {
    errors.add(
      SHEETS.EMPLOYEE_CLASSIFICATION,
      `Að hámarki ${grid.rowCapacity} starfsmenn eru studdir; fjöldi var ${employees.length}`,
    )
    return
  }

  if (personal.length > grid.columnPairCapacity) {
    errors.add(
      SHEETS.EMPLOYEE_CLASSIFICATION,
      `Að hámarki ${grid.columnPairCapacity} persónubundin undirviðmið eru studd; fjöldi var ${personal.length}`,
    )
    return
  }

  employees.forEach((employee, empIdx) => {
    const row = grid.firstRow + empIdx
    personal.forEach((ref, subIdx) => {
      const col = grid.firstCol + 2 * subIdx
      const cell = sheet.getCell(row, col)
      const stepOrder = readInteger(cell)
      if (stepOrder == null) return
      const assignment = buildAssignment(
        ref,
        stepOrder,
        SHEETS.EMPLOYEE_CLASSIFICATION,
        cell.address,
        errors,
      )
      if (assignment) employee.personalStepAssignments.push(assignment)
    })
  })
}
