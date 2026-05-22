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
      "1-indexed ordinal of the outlier employee in the report's parsed employee list. Mirrors `report_employee.ordinal` — used to cross-reference the canonical detected set on `report_result.outlier_analysis_snapshot.employees`.",
  })
  employeeOrdinal!: number | null

  @ApiOptionalEnum(GenderEnum, { enumName: 'GenderEnum', nullable: true })
  gender!: GenderEnum | null

  @ApiOptionalString({ nullable: true })
  roleTitle!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Null only when the parent report has `status = POSTPONED`. Otherwise required and non-empty.',
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
      "Employee's full-time-equivalent base salary at submission, projected from the matching `outlier_analysis_snapshot.employees` entry. Null if the snapshot has no matching ordinal.",
  })
  adjustedBaseSalary!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'Salary predicted by the regression line at the employee\'s exact score. Null when the regression had no slope (insufficient sample) or no matching snapshot entry exists.',
  })
  predictedBaseSalary!: number | null

  @ApiOptionalNumber({ nullable: true })
  scoreBucketRangeFrom!: number | null

  @ApiOptionalNumber({ nullable: true })
  scoreBucketRangeTo!: number | null

  @ApiOptionalString({
    nullable: true,
    description:
      "Sign of the deviation from the predicted salary: 'ABOVE' | 'BELOW' | 'EQUAL'. Null when no prediction was available.",
  })
  direction!: string | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      "Signed percent deviation of the employee's adjusted base salary from the predicted salary.",
  })
  differencePercent!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'Half-threshold band (in percent) used to flag this row as an outlier — i.e. the report-wide allowed deviation at submission time.',
  })
  allowedDifferencePercent!: number | null
}
