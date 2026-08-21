import { ApiOptionalEnum, ApiOptionalUuid } from '@dmr.is/decorators'
import { PagingQuery } from '@dmr.is/shared-dto'

import { SortDirectionEnum } from './get-reports.query.dto'

/**
 * Columns the outliers list may be sorted by. Deliberately limited to
 * DB-backed fields on `report_employee` (and its `role`) so paging stays
 * correct at the SQL level. Enum-gated to prevent sorting by arbitrary columns.
 *
 * ⚠️ **Every other column the úrbótaáætlun table displays is unsortable by
 * construction, not by omission.** `report_employee_outlier` has exactly two
 * real columns — `report_employee_id` and `group_id`. Tímakaup, væntanlegt
 * tímakaup, launafrávik, hlutur af óskýrðu and payStatus are all injected from
 * `wage_gap_decomposition_snapshot.employees` when the DTO is projected, so
 * there is no column for SQL to ORDER BY. Because the list is paged, sorting
 * in memory would order one page and look global — do not add these here
 * without first denormalising them onto the table.
 *
 * (The earlier version of this note pointed at
 * `report_result.outlier_analysis_snapshot`, which no longer exists; the
 * constraint is unchanged, only the source of the figures.)
 */
export enum ReportOutlierSortByEnum {
  EMPLOYEE_ORDINAL = 'employeeOrdinal',
  GENDER = 'gender',
  ROLE_TITLE = 'roleTitle',
  SCORE = 'score',
}

/**
 * Query for the report-outliers list. Extends paging with an optional sort.
 * When `sortBy` is omitted the list keeps its default role-title-then-ordinal
 * order, matching how the draft employee lists are served — the FE renders
 * outliers grouped by role, and the numbering the improvement plan prints is
 * the employee's ordinal within the report.
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
