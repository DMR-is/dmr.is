import {
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

import { GenderEnum } from '../../report/models/report.model'

export class ReportEmployeeOutlierDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportEmployeeId!: string

  @ApiOptionalNumber({
    nullable: true,
    description:
      "1-indexed ordinal of the outlier employee in the report's parsed employee list. Mirrors `report_employee.ordinal` — used to cross-reference the canonical detected set on `report_result.wage_gap_decomposition_snapshot.employees`.",
  })
  employeeOrdinal!: number | null

  @ApiOptionalEnum(GenderEnum, { enumName: 'GenderEnum', nullable: true })
  gender!: GenderEnum | null

  @ApiOptionalString({ nullable: true })
  roleTitle!: string | null

  @ApiOptionalNumber({ nullable: true })
  score!: number | null

  @ApiUUId({
    description:
      'Id of the outlier group this outlier belongs to. Every outlier always belongs to exactly one group.',
  })
  groupId!: string

  @ApiOptionalString({
    nullable: true,
    description:
      'Name of the outlier group this outlier belongs to. Denormalized from the group for convenient client-side grouping/labeling.',
  })
  groupName!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Explanation shared by the group. Denormalized from the outlier group — every outlier in the same group carries the same value. Null only while the parent report has `status = POSTPONED`.',
  })
  reason!: string | null

  @ApiOptionalString({ nullable: true })
  action!: string | null

  @ApiOptionalString({ nullable: true })
  signatureName!: string | null

  @ApiOptionalString({ nullable: true })
  signatureRole!: string | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'Reglulegt tímakaup (kr./klst.) at submission, projected from the matching `wage_gap_decomposition_snapshot.employees` entry. Null if the snapshot has no matching ordinal.',
  })
  regularHourlyWage!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      "Væntanlegt tímakaup at this employee's score, from the pooled log fit. Null when no matching snapshot entry exists.",
  })
  expectedHourlyWage!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'Signed percent deviation of the actual tímakaup from the expected one.',
  })
  deviationPercent!: number | null

  @ApiOptionalString({
    nullable: true,
    description:
      "'UNDERPAID' | 'OVERPAID' | 'ON_LINE' relative to the pooled fit. Members of the lágmarksmengi are always UNDERPAID — the set is lift-only.",
  })
  payStatus!: string | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'Share of the company-wide óskýrt figure this employee carries, in percent. This — not any individual tolerance — is why the row is on the list.',
  })
  contributionShare!: number | null
}
