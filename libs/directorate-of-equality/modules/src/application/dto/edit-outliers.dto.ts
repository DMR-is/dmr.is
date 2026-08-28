import { ArrayMinSize, IsInt } from 'class-validator'

import {
  ApiArray,
  ApiDtoArray,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

/**
 * One outlier group in the edit payload. The applicant supplies the shared
 * explanation (all four fields, non-empty) plus the ordinals of the detected
 * outliers this group covers. Across the whole payload every detected outlier
 * must be covered by exactly one group (the service enforces the set-match and
 * no-ordinal-in-two-groups invariants before persisting).
 */
export class EditOutlierGroupDto {
  @ApiOptionalString({
    description:
      'Applicant-supplied label for the group. Not required to be unique. When omitted (the implicit single-group case) the server assigns a default name.',
  })
  name?: string

  @ApiString({ minLength: 1 })
  reason!: string

  @ApiString({ minLength: 1 })
  action!: string

  @ApiString({ minLength: 1 })
  signatureName!: string

  @ApiString({ minLength: 1 })
  signatureRole!: string

  @ApiArray({
    type: [Number],
    description:
      "Ordinals of the outlier employees in this group (1-indexed, matches the `report_employee.ordinal` snapshot). Resolved against the canonical detected set from `report_result.outlier_analysis_snapshot`.",
  })
  @ArrayMinSize(1)
  @IsInt({ each: true })
  employeeOrdinals!: number[]
}

/**
 * Body for `PUT /api/v1/application/reports/:providerId/outliers`.
 *
 * Group-based all-or-none. The union of `employeeOrdinals` across all groups
 * must match the canonical detected outlier set exactly (every detected
 * ordinal covered once, no extras, no missing, no ordinal in two groups).
 * The edit replaces the report's grouping wholesale. When the report is in
 * status `POSTPONED`, a successful edit transitions it to `SUBMITTED` and emits
 * both an `EDITED` event and a `STATUS_CHANGED (POSTPONED → SUBMITTED)` event.
 * When the report is in status `IN_REVIEW` (correction path), status is
 * preserved and only an `EDITED` event is emitted.
 */
export class EditOutliersDto {
  @ApiDtoArray(EditOutlierGroupDto, {
    description:
      'Outlier groups for the report. The union of their employee ordinals must cover every detected outlier exactly once.',
  })
  @ArrayMinSize(1)
  groups!: EditOutlierGroupDto[]
}
