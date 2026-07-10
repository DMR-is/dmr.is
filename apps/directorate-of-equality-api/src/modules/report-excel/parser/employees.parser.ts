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
 * Stored as the `0…1` decimal the DB model uses (`1` → 100%, `0.85` → 85%).
 * Reject anything outside that range.
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
import { readDate, readNumber, readString, toIsoDate } from './cell'
import { ErrorBag } from './errors'

/**
 * Column letters in the Starfsmenn sheet. These MUST match the hand-authored
 * `template.xlsx` layout — the parser reads cells positionally, not by header.
 *
 * Column A ("#" / Raðnúmer) is deliberately absent: the template auto-numbers
 * it with `=ROW()-5`, and the parser never trusts formula results (see
 * `readInteger`). The ordinal is therefore derived from row position instead
 * (see {@link parseEmployees}), which reproduces `=ROW()-5` exactly.
 *
 * The salary breakdown lives in K–P (6 sub-components). The template also has
 * two trailing computed columns — Q "Viðbótarlaun" (`=SUM(K:L)`) and R
 * "Aukagreiðslur" (`=SUM(M:P)`) — which the parser deliberately does NOT
 * read: the parents are derived server-side from the children, so the
 * spreadsheet formulas are display-only.
 */
const COLS = {
  name: 'B',
  role: 'C',
  gender: 'D',
  workRatio: 'E',
  education: 'F',
  field: 'G',
  department: 'H',
  startDate: 'I',
  baseSalary: 'J',
  // Viðbótarlaun (additional salary) sub-components
  additionalFixedOvertime: 'K',
  additionalFixedCarAllowance: 'L',
  // Aukagreiðslur (bonus salary) sub-components
  bonusOccasionalCarAllowance: 'M',
  bonusOccasionalOvertime: 'N',
  bonusPayments: 'O',
  bonusOther: 'P',
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

/**
 * Stop scanning after this many consecutive empty rows. `sheet.rowCount` is
 * unreliable as a scan bound: whole-column formatting (borders/styles applied
 * to an entire column — very common in hand-edited files) pushes the stored
 * dimension out to Excel's ~1 048 576-row maximum. Because `readRow` calls
 * `sheet.getCell(...)` ~14× per row and exceljs *lazily materialises* a cell
 * object on every call, blindly scanning to `rowCount` can instantiate
 * hundreds of thousands of junk cells and exhaust the heap — even on an empty
 * upload. Real employee tables never contain a 200-row internal gap, so
 * breaking after this run bounds cell materialisation to the real data (plus a
 * small margin) while still tolerating the stray blank rows that made the
 * original code prefer `rowCount` over the under-reporting `actualRowCount`.
 */
const EMPTY_ROW_RUN_LIMIT = 200

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
  role: string | null
  genderDisplay: string | null
  workRatio: number | null
  educationDisplay: string | null
  baseSalary: number | null
  additionalFixedOvertime: number | null
  additionalFixedCarAllowance: number | null
  bonusOccasionalCarAllowance: number | null
  bonusOccasionalOvertime: number | null
  bonusPayments: number | null
  bonusOther: number | null
  field: string | null
  department: string | null
  startDate: Date | null
}

const readRow = (sheet: ExcelJS.Worksheet, r: number): RawRow => ({
  role: readString(sheet.getCell(`${COLS.role}${r}`)),
  genderDisplay: readString(sheet.getCell(`${COLS.gender}${r}`)),
  workRatio: readNumber(sheet.getCell(`${COLS.workRatio}${r}`)),
  educationDisplay: readString(sheet.getCell(`${COLS.education}${r}`)),
  baseSalary: readNumber(sheet.getCell(`${COLS.baseSalary}${r}`)),
  additionalFixedOvertime: readNumber(
    sheet.getCell(`${COLS.additionalFixedOvertime}${r}`),
  ),
  additionalFixedCarAllowance: readNumber(
    sheet.getCell(`${COLS.additionalFixedCarAllowance}${r}`),
  ),
  bonusOccasionalCarAllowance: readNumber(
    sheet.getCell(`${COLS.bonusOccasionalCarAllowance}${r}`),
  ),
  bonusOccasionalOvertime: readNumber(
    sheet.getCell(`${COLS.bonusOccasionalOvertime}${r}`),
  ),
  bonusPayments: readNumber(sheet.getCell(`${COLS.bonusPayments}${r}`)),
  bonusOther: readNumber(sheet.getCell(`${COLS.bonusOther}${r}`)),
  field: readString(sheet.getCell(`${COLS.field}${r}`)),
  department: readString(sheet.getCell(`${COLS.department}${r}`)),
  startDate: readDate(sheet.getCell(`${COLS.startDate}${r}`)),
})

const isEmptyRow = (row: RawRow): boolean =>
  !row.role &&
  !row.genderDisplay &&
  row.workRatio == null &&
  !row.educationDisplay &&
  row.baseSalary == null &&
  row.additionalFixedOvertime == null &&
  row.additionalFixedCarAllowance == null &&
  row.bonusOccasionalCarAllowance == null &&
  row.bonusOccasionalOvertime == null &&
  row.bonusPayments == null &&
  row.bonusOther == null &&
  !row.field &&
  !row.department &&
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
  ordinal: number,
  errors: ErrorBag,
): ParsedEmployeeDto | null => {
  const {
    role,
    genderDisplay,
    workRatio,
    educationDisplay,
    baseSalary,
    additionalFixedOvertime,
    additionalFixedCarAllowance,
    bonusOccasionalCarAllowance,
    bonusOccasionalOvertime,
    bonusPayments,
    bonusOther,
    field,
    department,
    startDate,
  } = row

  let ok = true
  const missingField = (col: string, icelandic: string): void => {
    errors.add(SHEETS.EMPLOYEES, `Nauðsynlegan reit vantar: ${icelandic}`, {
      row: r,
      column: col,
    })
    ok = false
  }

  // The 6 salary sub-components are all optional — no missing-field guards.
  // An absent value stays null in storage; parents derive it as 0.
  if (!role) missingField(COLS.role, 'Starf')
  if (!genderDisplay) missingField(COLS.gender, 'Kyn')
  if (workRatio == null) missingField(COLS.workRatio, 'Starfshlutfall')
  if (!educationDisplay) missingField(COLS.education, 'Menntun')
  if (baseSalary == null) missingField(COLS.baseSalary, 'Grunnlaun')
  if (!field) missingField(COLS.field, 'Svið')
  if (!department) missingField(COLS.department, 'Deild')
  if (!startDate) missingField(COLS.startDate, 'Ráðningardagur')

  if (
    !ok ||
    role == null ||
    genderDisplay == null ||
    workRatio == null ||
    educationDisplay == null ||
    baseSalary == null ||
    field == null ||
    department == null ||
    startDate == null
  ) {
    return null
  }

  const gender = GENDER_DISPLAY_TO_ENUM[genderDisplay]
  if (!gender) {
    errors.add(SHEETS.EMPLOYEES, `Óþekkt kyn „${genderDisplay}“`, {
      row: r,
      column: COLS.gender,
    })
    return null
  }

  const education = EDUCATION_DISPLAY_TO_ENUM[educationDisplay]
  if (!education) {
    errors.add(
      SHEETS.EMPLOYEES,
      `Óþekkt menntunarstig „${educationDisplay}“`,
      {
        row: r,
        column: COLS.education,
      },
    )
    return null
  }

  if (workRatio < 0 || workRatio > 1) {
    errors.add(
      SHEETS.EMPLOYEES,
      `Starfshlutfall ${workRatio} er utan leyfilegs bils 0–1`,
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
    workRatio,
    baseSalary,
    additionalFixedOvertime,
    additionalFixedCarAllowance,
    bonusOccasionalCarAllowance,
    bonusOccasionalOvertime,
    bonusPayments,
    bonusOther,
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
      `Nauðsynlegt blað „${SHEETS.EMPLOYEES}“ vantar`,
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

  let consecutiveEmpty = 0
  for (let r = TABLE_FIRST_DATA_ROW; r <= lastRow; r++) {
    const row = readRow(sheet, r)
    if (isEmptyRow(row)) {
      // Bail out of a runaway scan once we've seen a long unbroken blank run —
      // guards against an inflated `sheet.rowCount` (see EMPTY_ROW_RUN_LIMIT).
      if (++consecutiveEmpty >= EMPTY_ROW_RUN_LIMIT) break
      continue
    }
    consecutiveEmpty = 0

    // Ordinal is derived from row position, not read from column A. The
    // template auto-numbers column A with `=ROW()-5` (a formula the parser
    // never trusts), so `r - (TABLE_FIRST_DATA_ROW - 1)` reproduces exactly
    // the "#" the user sees on that row — keeping the imported ordinal aligned
    // with the sheet even across blank rows.
    const ordinal = r - (TABLE_FIRST_DATA_ROW - 1)

    const employee = buildEmployee(row, r, ordinal, errors)
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
