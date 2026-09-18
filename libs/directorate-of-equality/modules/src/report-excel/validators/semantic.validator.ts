/**
 * The workbook's view of payload semantics.
 *
 * The rules themselves moved to `report/lib/parsed-payload-semantics.ts`, so
 * they can run on a payload that never was a spreadsheet — see that file, and
 * `assertParsedPayloadValid`, which is where every channel now meets them.
 * What stays here is the translation back: an employer who uploaded a workbook
 * is told which **sheet** to open, in the same combined list as their cell-level
 * parse errors, which is the one-round-trip behaviour `ErrorBag` exists for.
 *
 * The mapping is one-to-one and lossless because the template's sheets are
 * named after exactly the regions the payload has. It is the reason the neutral
 * scopes could be named after payload regions rather than invented.
 */

import {
  PayloadIssueBag,
  PayloadIssueScope,
} from '../../report/lib/parsed-payload-issues'
import { collectParsedPayloadSemantics } from '../../report/lib/parsed-payload-semantics'
import { ParsedReportDto } from '../dto/parsed-report.dto'
import { ErrorBag } from '../parser/errors'
import { SHEETS } from '../workbook.schema'

/**
 * Which sheet an employer should open for each region of the payload.
 *
 * `ROLES` maps to Launagögn rather than Starfsmat, preserving where the
 * "at least one role" complaint has always pointed: roles are declared by the
 * Starf column of the salary-data sheet, and Starfsmat only scores the ones
 * that column produced.
 */
const SHEET_BY_SCOPE: Readonly<Record<PayloadIssueScope, string>> = {
  // Not a cell fault — a notice about the upload as a whole, so it points at
  // the overview rather than at whichever sheet tripped the cap.
  [PayloadIssueScope.REPORT]: SHEETS.OVERVIEW,
  [PayloadIssueScope.CRITERIA]: SHEETS.CRITERIA,
  [PayloadIssueScope.SUB_CRITERIA]: SHEETS.SUB_CRITERIA,
  [PayloadIssueScope.ROLES]: SHEETS.EMPLOYEES,
  [PayloadIssueScope.EMPLOYEES]: SHEETS.EMPLOYEES,
  [PayloadIssueScope.ROLE_CLASSIFICATION]: SHEETS.ROLE_CLASSIFICATION,
  [PayloadIssueScope.EMPLOYEE_CLASSIFICATION]: SHEETS.EMPLOYEE_CLASSIFICATION,
}

export const validateSemantics = (
  report: ParsedReportDto,
  errors: ErrorBag,
): void => {
  const issues = new PayloadIssueBag()
  collectParsedPayloadSemantics(report, issues)

  for (const issue of issues.list) {
    // Sheet only, never a row.
    //
    // An earlier version passed `issue.ordinal` as `row`, on the assumption
    // that an employee's ordinal IS its row. It is not: salary data starts at
    // `TABLE_FIRST_DATA_ROW` (6), and the classification sheets locate an
    // employee at their own grid's `firstRow` plus the employee's index — a
    // different number again, parsed from the sheet rather than known here.
    // Employee #1 was therefore pointed at row 1, inside the header block.
    //
    // The ordinal is not lost: every employee-scoped message names it
    // (`Starfsmaður #4`), which is the identity an employer can actually match
    // against their own data. A wrong cell reference is worse than none, so
    // this adapter gives the sheet and stops there; a row would have to come
    // from the parser's own mapping, which is not in scope here.
    errors.add(SHEET_BY_SCOPE[issue.scope], issue.message)
  }
}
