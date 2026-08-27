import { ParsedReportDto } from '../report-excel/dto/parsed-report.dto'

export interface IReportContentService {
  /**
   * Persists the child rows of a parsed salary report payload (roles,
   * criteria → sub-criteria → steps, role↔step joins, employees, and
   * employee↔personal-step joins) under an already-created `report` row.
   *
   * `employeeScores` is indexed by `parsed.employees` position — the value at
   * index `i` is written to employee `i`'s nullable `score` column. Callers
   * that have computed totals pass numbers; callers that seed a draft pass
   * nulls.
   *
   * Returns `employeeOrdinalToId`, mapping each employee's `ordinal` to its
   * newly created row id (used by outlier-group persistence downstream).
   */
  persistParsedChildren(
    reportId: string,
    parsed: ParsedReportDto,
    employeeScores: (number | null)[],
  ): Promise<{ employeeOrdinalToId: Map<number, string> }>
}

export const IReportContentService = Symbol('IReportContentService')
