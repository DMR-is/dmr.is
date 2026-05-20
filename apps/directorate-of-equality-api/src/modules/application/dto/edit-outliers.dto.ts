import { ArrayMinSize } from 'class-validator'

import { ApiDtoArray, ApiNumber, ApiString } from '@dmr.is/decorators'

/**
 * One row per outlier in the edit payload. The applicant supplies all four
 * explanation fields; non-empty strings are required (the service enforces
 * the required-after-resolve invariant before persisting).
 */
export class EditOutlierDto {
  @ApiNumber({
    description:
      "Ordinal of the outlier employee within the parent report's parsed payload (1-indexed, matches the `report_employee.ordinal` snapshot). Resolved against the canonical detected set from `report_result.outlier_analysis_snapshot`.",
  })
  employeeOrdinal!: number

  @ApiString({ minLength: 1 })
  reason!: string

  @ApiString({ minLength: 1 })
  action!: string

  @ApiString({ minLength: 1 })
  signatureName!: string

  @ApiString({ minLength: 1 })
  signatureRole!: string
}

/**
 * Body for `PUT /api/v1/application/reports/:providerId/outliers`.
 *
 * All-or-none. The submitted set must match the canonical detected outlier
 * set (one row per detected outlier, no extras, no missing). When the report
 * is in status `POSTPONED`, a successful edit transitions it to `SUBMITTED`
 * and emits both an `EDITED` event and a `STATUS_CHANGED (POSTPONED →
 * SUBMITTED)` event. When the report is in status `IN_REVIEW` (correction
 * path), status is preserved and only an `EDITED` event is emitted.
 */
export class EditOutliersDto {
  @ApiDtoArray(EditOutlierDto, {
    description:
      'One row per outlier on the report. Must include every detected outlier and nothing else.',
  })
  @ArrayMinSize(1)
  outliers!: EditOutlierDto[]
}
