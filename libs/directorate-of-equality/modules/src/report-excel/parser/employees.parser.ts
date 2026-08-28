/**
 * Parses the Launagögn sheet into employee DTOs + the set of unique role
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
 * ## Greiddar stundir (paid hours)
 *
 * All paid hours in the month, **overtime included** — the denominator of
 * reglulegt tímakaup. Column E carried `Starfshlutfall (0–1)` until the
 * template moved to an hourly basis; it now carries hours, so a value like
 * `173.33` is normal and `0.85` is a leftover from the old sheet.
 *
 * Accepted range is `MIN_PAID_HOURS_PER_MONTH`–`MAX_PAID_HOURS_PER_MONTH`.
 * Both bounds catch a specific data-entry error rather than merely describing
 * what the column can store — the LOWER one rejects a `Starfshlutfall (0–1)`
 * value carried over from the column this field replaced. The upper bound earns
 * its keep: under `salary_data_basis = AVERAGE` a submitter who enters the
 * annual total (~2 080) instead of the monthly average (~173) would otherwise
 * produce a tímakaup 12× too low, with nothing else to catch it.
 *
 * ## Role auto-discovery
 *
 * There is no separate "Roles" sheet in the template — roles are implicit:
 * whichever distinct `Starf` values appear in Launagögn become the
 * `ParsedRoleDto[]`, in first-appearance order. This matches the
 * Starfsmat columns, which are also derived from Launagögn.
 */

import ExcelJS from 'exceljs'

import {
  MAX_PAID_HOURS_PER_MONTH,
  MIN_PAID_HOURS_PER_MONTH,
} from '../../constants'
import { ParsedEmployeeDto, ParsedRoleDto } from '../dto/parsed-report.dto'
import {
  GENDER_DISPLAY_TO_ENUM,
  SHEETS,
  TABLE_FIRST_DATA_ROW,
} from '../workbook.schema'
import { readDate, readNumber, readString, toIsoDate } from './cell'
import { ErrorBag } from './errors'

/**
 * Column letters in the Launagögn sheet. These MUST match the hand-authored
 * `template.xlsx` layout — the parser reads cells positionally, not by header.
 *
 * Column A ("#" / Raðnúmer) is deliberately absent: the template auto-numbers
 * it with `=ROW()-5`, and the parser never trusts formula results (see
 * `readInteger`). The ordinal is therefore derived from row position instead
 * (see {@link parseEmployees}), which reproduces `=ROW()-5` exactly.
 *
 * The salary breakdown lives in J–O (6 sub-components). The template also has
 * two trailing computed columns — P "Viðbótarlaun" (`=SUM(J:K)`) and Q
 * "Aukagreiðslur" (`=SUM(L:O)`) — which the parser deliberately does NOT
 * read: the parents are derived server-side from the children, so the
 * spreadsheet formulas are display-only.
 */
const COLS = {
  name: 'B',
  role: 'C',
  gender: 'D',
  paidHours: 'E',
  field: 'F',
  department: 'G',
  startDate: 'H',
  baseSalary: 'I',
  // Viðbótarlaun (additional salary) sub-components
  additionalFixedOvertime: 'J',
  additionalFixedCarAllowance: 'K',
  // Aukagreiðslur (bonus salary) sub-components
  bonusOccasionalCarAllowance: 'L',
  bonusOccasionalOvertime: 'M',
  bonusPayments: 'N',
  bonusOther: 'O',
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
  paidHours: number | null
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
  paidHours: readNumber(sheet.getCell(`${COLS.paidHours}${r}`)),
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
  row.paidHours == null &&
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
    paidHours,
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

  // The 6 salary sub-components, field and department are all optional — no
  // missing-field guards. An absent value stays null in storage; the salary
  // parents derive their sum as 0.
  if (!role) missingField(COLS.role, 'Starf')
  if (!genderDisplay) missingField(COLS.gender, 'Kyn')
  if (paidHours == null) missingField(COLS.paidHours, 'Greiddar stundir')
  if (baseSalary == null) missingField(COLS.baseSalary, 'Grunnlaun')
  if (!startDate) missingField(COLS.startDate, 'Ráðningardagsetning')

  if (
    !ok ||
    role == null ||
    genderDisplay == null ||
    paidHours == null ||
    baseSalary == null ||
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

  // The sheet allows 0 and sub-0.01 values; the database does not, and either
  // would divide by (or round to) zero in reglulegt tímakaup. See the bounds'
  // docblock in core/constants.
  if (
    paidHours < MIN_PAID_HOURS_PER_MONTH ||
    paidHours > MAX_PAID_HOURS_PER_MONTH
  ) {
    errors.add(
      SHEETS.EMPLOYEES,
      `Greiddar stundir ${paidHours} eru utan leyfilegs bils ${MIN_PAID_HOURS_PER_MONTH}–${MAX_PAID_HOURS_PER_MONTH}`,
      { row: r, column: COLS.paidHours },
    )
    return null
  }

  return {
    ordinal,
    // Populated after all employees are parsed so width can scale with max ordinal.
    identifier: '',
    roleTitle: role,
    gender,
    field,
    department,
    startDate: toIsoDate(startDate),
    paidHours,
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
