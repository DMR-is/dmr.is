import { IsArray, IsEnum, IsOptional } from 'class-validator'

import { ApiProperty, IntersectionType, OmitType } from '@nestjs/swagger'

import { CaseStatusEnum } from './case-constants'
import { GetCasesQuery } from './get-cases-query.dto'

class StatusesToBeCounted {
  @ApiProperty({
    enum: [CaseStatusEnum],
    description: 'Statuses to be counted',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CaseStatusEnum, { each: true })
  statuses?: CaseStatusEnum[]
}

export class GetCasesWithStatusCountQuery extends IntersectionType(
  StatusesToBeCounted,
  OmitType(GetCasesQuery, ['status'] as const),
) {}

export class GetCasesWithDepartmentCountQuery extends OmitType(GetCasesQuery, [
  'department',
] as const) {}
