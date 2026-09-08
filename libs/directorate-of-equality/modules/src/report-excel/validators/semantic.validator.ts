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
    errors.add(SHEET_BY_SCOPE[issue.scope], issue.message, {
      // An employee's ordinal IS its row number in the salary-data sheet, which
      // is what makes this translation exact rather than approximate.
      row: issue.ordinal ?? undefined,
    })
  }
}
