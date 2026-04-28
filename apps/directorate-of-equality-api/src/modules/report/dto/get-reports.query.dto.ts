import { Transform } from 'class-transformer'
import { IsArray, IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import {
  ApiOptionalDateTime,
  ApiOptionalEnum,
  ApiOptionalString,
} from '@dmr.is/decorators'
import { PagingQuery } from '@dmr.is/shared-dto'

import { ReportStatusEnum, ReportTypeEnum } from '../models/report.model'

export enum ReportSortByEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  APPROVED_AT = 'approvedAt',
  VALID_UNTIL = 'validUntil',
  CORRECTION_DEADLINE = 'correctionDeadline',
  IDENTIFIER = 'identifier',
}

export enum SortDirectionEnum {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Admin-side report list query. Every filter is optional; missing filters
 * mean "no constraint on that dimension".
 *
 * Array-valued filters (`type`, `status`, `reviewerUserId`) accept either
 * `?type=A` or `?type=A&type=B` — normalised to arrays via `@Transform`.
 *
 * `unassignedReviewer=true` is **mutually exclusive** with `reviewerUserId`:
 * both filter the reviewer dimension. When both are present, `unassignedReviewer`
 * wins and `reviewerUserId` is ignored (admin "what needs me to pick it up"
 * workflow is the more common query).
 *
 * Free-text `q` matches case-insensitive across:
 * - `company.name`
 * - `company.nationalId` (kennitala)
 * - `report.identifier` (the `ABC-001` code)
 * - `report.contactName`
 * - `report.contactEmail`
 */
export class GetReportsQueryDto extends PagingQuery {
  @ApiProperty({
    enum: ReportTypeEnum,
    enumName: 'ReportTypeEnum',
    isArray: true,
    required: false,
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ReportTypeEnum, { each: true })
  type?: ReportTypeEnum[]

  @ApiProperty({
    enum: ReportStatusEnum,
    enumName: 'ReportStatusEnum',
    isArray: true,
    required: false,
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ReportStatusEnum, { each: true })
  status?: ReportStatusEnum[]

  @ApiProperty({ type: [String], format: 'uuid', required: false })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  reviewerUserId?: string[]

  @ApiProperty({
    type: Boolean,
    required: false,
    description:
      'When true, returns only reports with no reviewer assigned. Overrides `reviewerUserId` if both are set.',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  unassignedReviewer?: boolean

  @ApiOptionalDateTime()
  createdFrom?: Date

  @ApiOptionalDateTime()
  createdTo?: Date

  @ApiOptionalDateTime()
  approvedFrom?: Date

  @ApiOptionalDateTime()
  approvedTo?: Date

  @ApiOptionalDateTime()
  validUntilFrom?: Date

  @ApiOptionalDateTime()
  validUntilTo?: Date

  @ApiOptionalDateTime()
  correctionDeadlineFrom?: Date

  @ApiOptionalDateTime()
  correctionDeadlineTo?: Date

  @ApiOptionalString({
    description:
      'Free-text search across company name, kennitala, report identifier, contact name, and contact email. Case-insensitive partial match.',
  })
  q?: string

  @ApiOptionalEnum(ReportSortByEnum, { enumName: 'ReportSortByEnum' })
  sortBy?: ReportSortByEnum

  @ApiOptionalEnum(SortDirectionEnum, { enumName: 'SortDirectionEnum' })
  direction?: SortDirectionEnum
}
