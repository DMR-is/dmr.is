/**
 * Top-level parser entrypoint — takes an uploaded xlsx buffer and returns
 * a fully-populated `ParsedReportDto` (or throws a `BadRequestException`
 * carrying a structured error list if anything in the workbook is invalid).
 *
 * ## Orchestration order
 *
 * 1. Load the workbook via exceljs.
 * 2. Parse criteria + sub-criteria (tree shape, step scores computed).
 * 3. Parse employees (Starfsmenn) — derives the role list as a side effect.
 * 4. Parse role classifications (Flokkun starfa) — attaches step assignments
 *    to the roles produced in (3).
 * 5. Parse employee classifications (Flokkun starfsmanna) — attaches
 *    personal-sub assignments to the employees produced in (3).
 * 6. Run the semantic validator on the assembled tree.
 * 7. Throw on any accumulated errors, else return the `ParsedReportDto`.
 *
 * Report-level metadata (admin / contact details) and company identification
 * are NOT parsed here — they live in the app-system's auth context and are
 * owned by the submit flow, not by the Excel importer.
 */

import ExcelJS from 'exceljs'

import { BadRequestException } from '@nestjs/common'

import { ParsedReportDto } from '../dto/parsed-report.dto'
import { validateSemantics } from '../validators/semantic.validator'
import {
  parseEmployeeClassifications,
  parseRoleClassifications,
} from './classifications.parser'
import { parseCriteriaTree } from './criteria.parser'
import { parseEmployees } from './employees.parser'
import { ErrorBag } from './errors'

export const parseWorkbook = async (
  fileBuffer: Buffer,
): Promise<ParsedReportDto> => {
  const workbook = new ExcelJS.Workbook()
  try {
    // exceljs declares its own `Buffer extends ArrayBuffer` shape that
    // conflicts with Node 20's `Buffer extends Uint8Array<ArrayBufferLike>`.
    // Hand it the underlying ArrayBuffer slice to satisfy both contracts.
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength,
    ) as ArrayBuffer
    await workbook.xlsx.load(arrayBuffer)
  } catch (e) {
    throw new BadRequestException({
      message: 'Could not read workbook — is this a valid xlsx file?',
      errors: [
        {
          sheet: '(workbook)',
          row: null,
          column: null,
          message: e instanceof Error ? e.message : 'unknown xlsx load error',
        },
      ],
    })
  }

  const errors = new ErrorBag()

  const criteria = parseCriteriaTree(workbook, errors)
  const { employees, roles } = parseEmployees(workbook, errors)
  parseRoleClassifications(workbook, criteria, roles, errors)
  parseEmployeeClassifications(workbook, criteria, employees, errors)

  const report: ParsedReportDto = { criteria, roles, employees }

  // Semantic pass runs AFTER parse so it can rely on the tree being
  // structurally sound (no rogue types, no out-of-range step orders). It
  // shares the same error bag, so the client sees parse + semantic problems
  // in a single response.
  validateSemantics(report, errors)

  if (errors.hasErrors) {
    throw new BadRequestException({
      message: 'Workbook failed validation',
      errors: [...errors.list],
    })
  }

  return report
}
