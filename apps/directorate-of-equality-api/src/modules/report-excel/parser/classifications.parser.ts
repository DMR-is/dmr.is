/**
 * Parses the two "Flokkun" matrix sheets into step-assignment records that
 * attach onto roles (Starfsmat) and employees (Einstaklingsmat).
 *
 * ## Layout recap
 *
 * Both sheets are wide matrices. Their row/column semantics are **derived
 * from the raw-data sheets**, not read out of the matrix headers (which are
 * formulas we don't evaluate):
 *
 * - **Starfsmat**
 *   - Rows map 1:1 to distinct roles in the order they first appear on
 *     Launagögn.
 *   - Step-order columns hold one value per job-based sub-criterion in the
 *     order they appear on Undirviðmið (filtered to `type != PERSONAL`). A
 *     computed score column is interleaved after each, so inputs sit on every
 *     second column.
 *
 * - **Einstaklingsmat**
 *   - Rows map 1:1 to employees in ordinal order.
 *   - Step-order columns hold one value per personal sub-criterion, in the
 *     order personal subs appear on Undirviðmið (same every-second-column
 *     interleaving).
 *
 * The row/column geometry of each step-input region is read from the
 * `ROLE_STEP_INPUTS` / `EMP_STEP_INPUTS` named ranges (see
 * {@link readStepInputGrid}) rather than hard-coded.
 *
 * ⚠️ **Rows are provisioning, columns are capacity.** Einstaklingsmat ships
 * with 500 employee rows, but an employer with more is expected to extend the
 * sheet — the per-row formulas pull from Launagögn, which spans 10 000. So the
 * employee bound is `MAX_EMPLOYEES`, not the named range's row extent. The
 * COLUMN extent *is* a real bound: widening the matrix means inserting
 * interleaved Þrep/Stig pairs, which an employer is not expected to do.
 *
 * Blank cells mean "no assignment" and are skipped, so a short Einstaklingsmat
 * would silently understate scores rather than fail. Nothing downstream catches
 * that — `assertParsedPayloadIntegrity` validates the assignments that ARE
 * present, never that every employee has one — so this parser checks that the
 * sheet reaches every employee before reading it.
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
 * the named range means the sub-criterion counts are bounded by what the
 * template physically provisions, and grow if the template does — no code
 * change.
 *
 * `rowCapacity` is a real bound for **roles** (Starfsmat provisions 100, which
 * is also `MAX_ROLES`) but only provisioning for **employees** — see the file
 * docblock.
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
 * Parse a single rectangular named range (e.g. `Starfsmat!$G$11:$GX$110`)
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

  // No personal sub-criteria ⇒ nothing on this sheet is read, so its geometry
  // is irrelevant. Returning early matters: the row check below would otherwise
  // reject a large submission over a sheet it never needed to touch.
  if (personal.length === 0) return

  const grid = readStepInputGrid(workbook, NAMED_RANGES.EMP_STEP_INPUTS)
  if (!grid) {
    errors.add(
      SHEETS.EMPLOYEE_CLASSIFICATION,
      `Nafngreint svæði „${NAMED_RANGES.EMP_STEP_INPUTS}“ vantar eða er gallað`,
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

  // The named range's ROW extent is what the template SHIPS with, not a limit:
  // Einstaklingsmat provisions 500 employee rows, and a larger employer is
  // expected to extend the sheet itself (the per-row formulas pull from
  // Launagögn, which spans 10 000). So rows are bounded by `MAX_EMPLOYEES` and
  // by how far the uploaded sheet actually reaches — never by `grid.rowCapacity`.
  //
  // The column extent IS a real bound (checked above): widening the matrix means
  // inserting interleaved Þrep/Stig column pairs, not copying a row down.
  const lastReachableRow = sheet.rowCount
  const reachableEmployees = Math.max(lastReachableRow - grid.firstRow + 1, 0)

  // Reading past the sheet's extent would return blanks, and blank means "no
  // assignment" (see docblock) — so an employer who added employees to
  // Launagögn without extending Einstaklingsmat would get silently incomplete
  // scores rather than an error. Nothing downstream catches that:
  // `assertParsedPayloadIntegrity` validates the assignments that ARE present,
  // never that every employee has one. Hence an explicit, actionable error.
  if (employees.length > reachableEmployees) {
    errors.add(
      SHEETS.EMPLOYEE_CLASSIFICATION,
      `Einstaklingsmat nær aðeins til ${reachableEmployees} starfsmanna en skýrslan er með ${employees.length}; ` +
        `bættu við röðum á blaðið svo hver starfsmaður hafi sína röð`,
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
