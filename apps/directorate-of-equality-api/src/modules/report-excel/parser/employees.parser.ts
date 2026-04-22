/**
 * Parses the Starfsmenn sheet into employee DTOs + the set of unique role
 * titles referenced.
 *
 * ## PII handling
 *
 * The `Nafn` column is deliberately **not** carried into the parsed output.
 * DoE policy prohibits persisting personal names; the application system
 * matches employees by ordinal against its own records. The name only
 * exists in the workbook for the employer's convenience while filling it.
 *
 * ## Starfshlutfall (work ratio)
 *
 * Stored as percent in the workbook (`85` → 85%) but normalised to the
 * `0…1` decimal the DB model uses (`0.85`). Reject anything outside that
 * range post-normalisation.
 *
 * ## Role auto-discovery
 *
 * There is no separate "Roles" sheet in the template — roles are implicit:
 * whichever distinct `Starf` values appear in Starfsmenn become the
 * `ParsedRoleDto[]`, in first-appearance order. This matches the
 * Flokkun starfa columns, which are also derived from Starfsmenn.
 */

import ExcelJS from 'exceljs'

import { ParsedEmployeeDto, ParsedRoleDto } from '../dto/parsed-report.dto'
import {
  EDUCATION_DISPLAY_TO_ENUM,
  GENDER_DISPLAY_TO_ENUM,
  SHEETS,
  TABLE_FIRST_DATA_ROW,
} from '../workbook.schema'
import {
  readDate,
  readInteger,
  readNumber,
  readString,
  toIsoDate,
} from './cell'
import { ErrorBag } from './errors'

const COLS = {
  ordinal: 'A',
  name: 'B',
  role: 'C',
  gender: 'D',
  workRatio: 'E',
  education: 'F',
  baseSalary: 'G',
  field: 'H',
  additionalSalary: 'I',
  department: 'J',
  bonusSalary: 'K',
  startDate: 'L',
} as const

const MAX_EMPLOYEE_ROWS = 60

export type EmployeesParseResult = {
  employees: ParsedEmployeeDto[]
  roles: ParsedRoleDto[]
}

type RawRow = {
  ordinal: number | null
  role: string | null
  genderDisplay: string | null
  workRatioPct: number | null
  educationDisplay: string | null
  baseSalary: number | null
  field: string | null
  additionalSalary: number | null
  department: string | null
  bonusSalary: number | null
  startDate: Date | null
}

const readRow = (sheet: ExcelJS.Worksheet, r: number): RawRow => ({
  ordinal: readInteger(sheet.getCell(`${COLS.ordinal}${r}`)),
  role: readString(sheet.getCell(`${COLS.role}${r}`)),
  genderDisplay: readString(sheet.getCell(`${COLS.gender}${r}`)),
  workRatioPct: readNumber(sheet.getCell(`${COLS.workRatio}${r}`)),
  educationDisplay: readString(sheet.getCell(`${COLS.education}${r}`)),
  baseSalary: readNumber(sheet.getCell(`${COLS.baseSalary}${r}`)),
  field: readString(sheet.getCell(`${COLS.field}${r}`)),
  additionalSalary: readNumber(sheet.getCell(`${COLS.additionalSalary}${r}`)),
  department: readString(sheet.getCell(`${COLS.department}${r}`)),
  bonusSalary: readNumber(sheet.getCell(`${COLS.bonusSalary}${r}`)),
  startDate: readDate(sheet.getCell(`${COLS.startDate}${r}`)),
})

const isEmptyRow = (row: RawRow): boolean =>
  !row.role &&
  !row.genderDisplay &&
  row.workRatioPct == null &&
  !row.educationDisplay &&
  row.baseSalary == null &&
  !row.field &&
  row.additionalSalary == null &&
  !row.department &&
  row.bonusSalary == null &&
  !row.startDate

/**
 * Validate one raw row and, if everything required is present and valid,
 * return a fully-typed `ParsedEmployeeDto`. Otherwise record errors for
 * every missing / invalid field and return `null`. The non-null narrowing
 * here replaces what used to be a validate-then-assert pattern — everything
 * the return type claims has been proven present by guards above it.
 */
const buildEmployee = (
  row: RawRow,
  r: number,
  errors: ErrorBag,
): ParsedEmployeeDto | null => {
  const {
    ordinal,
    role,
    genderDisplay,
    workRatioPct,
    educationDisplay,
    baseSalary,
    field,
    additionalSalary,
    department,
    bonusSalary,
    startDate,
  } = row

  if (ordinal == null) {
    errors.add(SHEETS.EMPLOYEES, 'Missing ordinal (col A) on non-empty row', {
      row: r,
      column: COLS.ordinal,
    })
    return null
  }

  let ok = true
  const missingField = (col: string, icelandic: string): void => {
    errors.add(SHEETS.EMPLOYEES, `Missing required field: ${icelandic}`, {
      row: r,
      column: col,
    })
    ok = false
  }

  if (!role) missingField(COLS.role, 'Starf')
  if (!genderDisplay) missingField(COLS.gender, 'Kyn')
  if (workRatioPct == null) missingField(COLS.workRatio, 'Starfshlutfall')
  if (!educationDisplay) missingField(COLS.education, 'Menntun')
  if (baseSalary == null) missingField(COLS.baseSalary, 'Grunnlaun')
  if (!field) missingField(COLS.field, 'Svið')
  if (additionalSalary == null)
    missingField(COLS.additionalSalary, 'Viðbótarlaun')
  if (!department) missingField(COLS.department, 'Deild')
  if (!startDate) missingField(COLS.startDate, 'Ráðningardagur')

  if (
    !ok ||
    role == null ||
    genderDisplay == null ||
    workRatioPct == null ||
    educationDisplay == null ||
    baseSalary == null ||
    field == null ||
    additionalSalary == null ||
    department == null ||
    startDate == null
  ) {
    return null
  }

  const gender = GENDER_DISPLAY_TO_ENUM[genderDisplay]
  if (!gender) {
    errors.add(SHEETS.EMPLOYEES, `Unknown gender "${genderDisplay}"`, {
      row: r,
      column: COLS.gender,
    })
    return null
  }

  const education = EDUCATION_DISPLAY_TO_ENUM[educationDisplay]
  if (!education) {
    errors.add(
      SHEETS.EMPLOYEES,
      `Unknown education level "${educationDisplay}"`,
      {
        row: r,
        column: COLS.education,
      },
    )
    return null
  }

  if (workRatioPct < 0 || workRatioPct > 100) {
    errors.add(
      SHEETS.EMPLOYEES,
      `Starfshlutfall ${workRatioPct} out of range 0–100`,
      { row: r, column: COLS.workRatio },
    )
    return null
  }

  return {
    ordinal,
    roleTitle: role,
    education,
    gender,
    field,
    department,
    startDate: toIsoDate(startDate),
    workRatio: workRatioPct / 100,
    baseSalary,
    additionalSalary,
    bonusSalary,
    personalStepAssignments: [],
  }
}

export const parseEmployees = (
  workbook: ExcelJS.Workbook,
  errors: ErrorBag,
): EmployeesParseResult => {
  const sheet = workbook.getWorksheet(SHEETS.EMPLOYEES)
  if (!sheet) {
    errors.add(
      SHEETS.EMPLOYEES,
      `Required sheet "${SHEETS.EMPLOYEES}" is missing`,
    )
    return { employees: [], roles: [] }
  }

  const employees: ParsedEmployeeDto[] = []
  const rolesByTitle = new Map<string, ParsedRoleDto>()

  for (
    let r = TABLE_FIRST_DATA_ROW;
    r < TABLE_FIRST_DATA_ROW + MAX_EMPLOYEE_ROWS;
    r++
  ) {
    const row = readRow(sheet, r)
    if (isEmptyRow(row)) continue

    const employee = buildEmployee(row, r, errors)
    if (!employee) continue

    if (!rolesByTitle.has(employee.roleTitle)) {
      rolesByTitle.set(employee.roleTitle, {
        title: employee.roleTitle,
        stepAssignments: [],
      })
    }
    employees.push(employee)
  }

  return { employees, roles: [...rolesByTitle.values()] }
}
