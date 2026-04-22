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
 *   - Rows 7+ map 1:1 to job-based sub-criteria in the order they appear on
 *     Undirviðmið (filtered to `type != PERSONAL`).
 *   - Columns G, I, K, M, O, Q, S, U hold step orders — one per role, in
 *     the order roles are first seen on Starfsmenn. (H/J/L/… are computed
 *     scores to the right of each step cell.)
 *
 * - **Flokkun starfsmanna**
 *   - Rows 7–56 map 1:1 to employees in ordinal order.
 *   - Columns D, F, H, J, L, N, P, R, T, V, X, Z, AB, AD, AF hold step
 *     orders — one per personal sub-criterion, in the order personal subs
 *     appear on Undirviðmið.
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
import { SHEETS } from '../workbook.schema'
import { readInteger } from './cell'
import { ErrorBag } from './errors'

const ROLE_STEP_FIRST_DATA_ROW = 7
const EMPLOYEE_STEP_FIRST_DATA_ROW = 7

/** Columns in Flokkun starfa that hold role step-order inputs. */
const ROLE_STEP_COLS = ['G', 'I', 'K', 'M', 'O', 'Q', 'S', 'U'] as const

/** Columns in Flokkun starfsmanna that hold employee step-order inputs. */
const EMPLOYEE_STEP_COLS = [
  'D',
  'F',
  'H',
  'J',
  'L',
  'N',
  'P',
  'R',
  'T',
  'V',
  'X',
  'Z',
  'AB',
  'AD',
  'AF',
] as const

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
      `Step ${stepOrder} out of range 1–${ref.numSteps} for sub-criterion "${ref.subTitle}"`,
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
      `Required sheet "${SHEETS.ROLE_CLASSIFICATION}" is missing`,
    )
    return
  }

  const { jobBased } = flattenSubRefs(criteria)

  if (roles.length > ROLE_STEP_COLS.length) {
    errors.add(
      SHEETS.ROLE_CLASSIFICATION,
      `Up to ${ROLE_STEP_COLS.length} distinct roles supported; got ${roles.length}`,
    )
    return
  }

  roles.forEach((role, roleIdx) => {
    const col = ROLE_STEP_COLS[roleIdx]
    jobBased.forEach((ref, subIdx) => {
      const row = ROLE_STEP_FIRST_DATA_ROW + subIdx
      const cell = sheet.getCell(`${col}${row}`)
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
      `Required sheet "${SHEETS.EMPLOYEE_CLASSIFICATION}" is missing`,
    )
    return
  }

  const { personal } = flattenSubRefs(criteria)

  if (personal.length > EMPLOYEE_STEP_COLS.length) {
    errors.add(
      SHEETS.EMPLOYEE_CLASSIFICATION,
      `Up to ${EMPLOYEE_STEP_COLS.length} personal sub-criteria supported; got ${personal.length}`,
    )
    return
  }

  employees.forEach((employee, empIdx) => {
    const row = EMPLOYEE_STEP_FIRST_DATA_ROW + empIdx
    personal.forEach((ref, subIdx) => {
      const col = EMPLOYEE_STEP_COLS[subIdx]
      const cell = sheet.getCell(`${col}${row}`)
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
