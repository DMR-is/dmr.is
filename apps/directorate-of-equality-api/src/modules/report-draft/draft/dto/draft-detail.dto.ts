import {
  ApiDto,
  ApiEnum,
  ApiNumber,
  ApiOptionalDateTime,
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

import {
  GenderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../../../report/models/report.enums'

/** Row counts of the draft's child collections — full data via list endpoints. */
export class DraftCountsDto {
  @ApiNumber()
  employees!: number

  @ApiNumber()
  criteria!: number

  @ApiNumber()
  outlierGroups!: number
}

/**
 * Company-facing view of an in-progress DRAFT report. Carries the report-level
 * header the applicant has filled in so far plus child-collection counts; the
 * children themselves are paginated through their own list endpoints. A draft
 * has no `company_report` snapshot or computed result yet — those are produced
 * at submit — so neither is part of this shape.
 */
export class DraftDetailDto {
  @ApiUUId()
  id!: string

  @ApiEnum(ReportTypeEnum, { enumName: 'ReportTypeEnum' })
  type!: ReportTypeEnum

  @ApiEnum(ReportStatusEnum, { enumName: 'ReportStatusEnum' })
  status!: ReportStatusEnum

  @ApiOptionalString({ nullable: true })
  identifier!: string | null

  @ApiOptionalString({ nullable: true })
  companyAdminName!: string | null

  @ApiOptionalString({ nullable: true })
  companyAdminEmail!: string | null

  @ApiOptionalEnum(GenderEnum, { nullable: true, enumName: 'GenderEnum' })
  companyAdminGender!: GenderEnum | null

  @ApiOptionalString({ nullable: true })
  contactName!: string | null

  @ApiOptionalString({ nullable: true })
  contactEmail!: string | null

  @ApiOptionalString({ nullable: true })
  contactPhone!: string | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeMaleCount!: number | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeFemaleCount!: number | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeNeutralCount!: number | null

  @ApiOptionalString({ nullable: true })
  equalityReportContent!: string | null

  @ApiDto(DraftCountsDto)
  counts!: DraftCountsDto

  @ApiOptionalDateTime({ nullable: true })
  createdAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  updatedAt!: Date | null
}
