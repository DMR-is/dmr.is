import { ApiOptionalEnum, ApiOptionalUuid } from '@dmr.is/decorators'
import { PagingQuery } from '@dmr.is/shared-dto'

import { SortDirectionEnum } from './get-reports.query.dto'

/**
 * Columns the outliers list may be sorted by. Deliberately limited to
 * DB-backed fields on `report_employee` (and its `role`) so paging stays
 * correct at the SQL level — the analysis-snapshot fields (salary, difference,
 * etc.) live on `report_result.outlier_analysis_snapshot` and aren't part of
 * the queried table, so they can't be ordered here. Enum-gated to prevent
 * sorting by arbitrary columns.
 */
export enum ReportOutlierSortByEnum {
  EMPLOYEE_ORDINAL = 'employeeOrdinal',
  GENDER = 'gender',
  ROLE_TITLE = 'roleTitle',
  SCORE = 'score',
}

/**
 * Query for the report-outliers list. Extends paging with an optional sort.
 * When `sortBy` is omitted the list keeps its default `employeeOrdinal`
 * ascending order (matching the FE improvement-plan numbering).
 */
export class GetReportOutliersQueryDto extends PagingQuery {
  @ApiOptionalUuid({
    description:
      'Restrict the list to the outliers belonging to a single group.',
  })
  groupId?: string

  @ApiOptionalEnum(ReportOutlierSortByEnum, {
    enumName: 'ReportOutlierSortByEnum',
  })
  sortBy?: ReportOutlierSortByEnum

  @ApiOptionalEnum(SortDirectionEnum, { enumName: 'SortDirectionEnum' })
  direction?: SortDirectionEnum
}
