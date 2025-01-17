import { Expose } from 'class-transformer'
import { IsArray, IsEnum, IsOptional } from 'class-validator'

import { ApiProperty, IntersectionType, OmitType } from '@nestjs/swagger'

import { CaseStatusEnum } from './case-constants'
import { GetCasesQuery } from './get-cases-query.dto'

class StatusesToBeCounted {
  @ApiProperty({
    enum: CaseStatusEnum,
    enumName: 'CaseStatusEnum',
    description: 'Statuses to be counted',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CaseStatusEnum, { each: true })
  @Expose()
  statuses?: CaseStatusEnum[]
}

export class GetCasesWithStatusCountQuery extends IntersectionType(
  StatusesToBeCounted,
  OmitType(GetCasesQuery, ['status'] as const),
) {}

export class GetCasesWithDepartmentCountQuery extends OmitType(GetCasesQuery, [
  'department',
] as const) {}
