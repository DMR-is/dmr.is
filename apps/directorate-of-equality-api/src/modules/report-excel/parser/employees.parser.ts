/**
 * Parses the Starfsmenn sheet into employee DTOs + the set of unique role
 * titles referenced.
 *
 * ## PII handling
 *
 * The `Nafn` column is deliberately **not** carried into the parsed output.
 * Each employee gets a synthesised pseudonymous `identifier` instead
 * (`{randomPrefix}-{paddedOrdinal}`, e.g. `KVZ-001`), used by the app-system
 * as a display handle in the UI where a real name would normally appear.
 * The prefix is random per import and is not a stable key across imports.
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

/**
 * Safety ceiling on rows scanned. Real companies can easily exceed
 * 2 000 employees, so we avoid a hard cap — iteration bounds come from
 * `sheet.actualRowCount`. This number only kicks in for defensively broken
 * files where every cell reports populated. 50k rows is ~3 orders of
 * magnitude above real submissions; hitting it is almost certainly a
 * corrupt or adversarial upload.
 */
const ABSOLUTE_MAX_EMPLOYEE_ROWS = 50000

/** Minimum padding for the ordinal portion of the identifier — always ≥3 digits so small imports read as "ABC-001", large ones naturally grow ("ABC-2000"). */
const IDENTIFIER_MIN_ORDINAL_DIGITS = 3

/** Random uppercase 3-letter prefix, e.g. "KVZ". 26³ = 17 576 combinations — collision doesn't matter because the prefix only has to be unique-ish for human readability, not a key. */
export const makeIdentifierPrefix = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return Array.from(
    { length: 3 },
    () => letters[Math.floor(Math.random() * letters.length)],
  ).join('')
}

export const formatEmployeeIdentifier = (
  prefix: string,
  ordinal: number,
  maxOrdinal: number,
): string => {
  const width = Math.max(
    IDENTIFIER_MIN_ORDINAL_DIGITS,
    String(maxOrdinal).length,
  )
  return `${prefix}-${String(ordinal).padStart(width, '0')}`
}

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
    // Populated after all employees are parsed so width can scale with max ordinal.
    identifier: '',
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

export type ParseEmployeesOptions = {
  /** Override the random identifier prefix. Used by tests for determinism. */
  identifierPrefix?: string
}

export const parseEmployees = (
  workbook: ExcelJS.Workbook,
  errors: ErrorBag,
  options: ParseEmployeesOptions = {},
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

  // Use `rowCount`, not `actualRowCount`. exceljs's `actualRowCount`
  // under-reports when trailing rows lack certain cell types — observed
  // returning 103 on a file with populated rows up to 105, silently
  // dropping the last two employees. `rowCount` is the highest row index
  // the workbook knows about; `isEmptyRow` handles any trailing blanks.
  // Capped at ABSOLUTE_MAX_EMPLOYEE_ROWS as a sanity guard on malformed uploads.
  const lastRow = Math.min(
    sheet.rowCount,
    TABLE_FIRST_DATA_ROW + ABSOLUTE_MAX_EMPLOYEE_ROWS - 1,
  )

  for (let r = TABLE_FIRST_DATA_ROW; r <= lastRow; r++) {
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

  if (employees.length > 0) {
    const prefix = options.identifierPrefix ?? makeIdentifierPrefix()
    const maxOrdinal = Math.max(...employees.map((e) => e.ordinal))
    for (const e of employees) {
      e.identifier = formatEmployeeIdentifier(prefix, e.ordinal, maxOrdinal)
    }
  }

  return { employees, roles: [...rolesByTitle.values()] }
}
