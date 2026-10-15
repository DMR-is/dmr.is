import { IsEnum, IsOptional, IsString, Matches } from 'class-validator'

import { ApiEnum, ApiOptionalString, ApiString } from '@dmr.is/decorators'

import { ReportTypeEnum } from '../../report/models/report.enums'

export class UpdateCompanyDueDateDto {
  @ApiEnum(ReportTypeEnum, {
    enumName: 'ReportTypeEnum',
    description:
      'Which next-due date to move: EQUALITY → `nextEqualityReportDueAt`, SALARY → `nextSalaryReportDueAt`.',
  })
  @IsEnum(ReportTypeEnum)
  reportType!: ReportTypeEnum

  @ApiString({
    example: '2026-11-20',
    description:
      'The new due date as a calendar day, `YYYY-MM-DD`. Stored as the end of that day (UTC), like every other next-due date. Cannot be cleared.',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dueDate must be YYYY-MM-DD' })
  dueDate!: string

  @ApiOptionalString({
    nullable: true,
    description:
      'Optional reason for the change, e.g. an extension granted, kept on the company timeline.',
  })
  @IsOptional()
  @IsString()
  reason?: string | null
}
