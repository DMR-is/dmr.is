import { Transform } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import {
  ApiOptionalArray,
  ApiOptionalDateTime,
  ApiOptionalEnum,
  ApiOptionalString,
} from '@dmr.is/decorators'
import { PagingQuery } from '@dmr.is/shared-dto'

import {
  CompanySectorEnum,
  CompanySizeEnum,
} from '../../company/models/company.enums'
import {
  CommunicationStatusEnum,
  EqualityCoverageSourceEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../models/report.enums'

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

  @ApiProperty({
    type: Boolean,
    required: false,
    description:
      'When true, returns only reports that have at least one employee outlier (i.e. an improvement plan applies). When false, returns only reports with no outliers. Omit for no constraint.',
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true
    if (value === 'false' || value === false) return false
    return undefined
  })
  @IsOptional()
  @IsBoolean()
  hasImprovementPlan?: boolean

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

  @ApiOptionalDateTime({
    description:
      'Return only reports whose salary data period (`salaryDataPeriod`, the month the pay figures describe) starts on or after this date. Salary reports only — an equality report has no period, so any bound here excludes them.',
  })
  salaryDataPeriodFrom?: Date

  @ApiOptionalDateTime({
    description:
      'Upper bound on the salary data period. See `salaryDataPeriodFrom`.',
  })
  salaryDataPeriodTo?: Date

  @ApiProperty({
    enum: CommunicationStatusEnum,
    enumName: 'CommunicationStatusEnum',
    isArray: true,
    required: false,
    description:
      'Return only reports in one of the given communication states (samskiptastaða).',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CommunicationStatusEnum, { each: true })
  communicationStatus?: CommunicationStatusEnum[]

  @ApiProperty({
    enum: EqualityCoverageSourceEnum,
    enumName: 'EqualityCoverageSourceEnum',
    isArray: true,
    required: false,
    description:
      'Return only reports whose equality coverage came from the given source — REPORT (filed in this system) or LEGACY (an unexpired certification carried over from the retired register).',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(EqualityCoverageSourceEnum, { each: true })
  equalitySource?: EqualityCoverageSourceEnum[]

  // ---------------------------------------------------------------------
  // Company dimensions
  //
  // A report carries no company columns of its own — it reaches the company
  // through `company_report`. These are resolved with one correlated EXISTS
  // against the PARENT snapshot (see `buildReportCompanyWhere`), so they
  // narrow the same set of reports the list already shows and cannot
  // multiply a group filing into one row per subsidiary.
  // ---------------------------------------------------------------------

  @ApiProperty({
    enum: CompanySizeEnum,
    enumName: 'CompanySizeEnum',
    isArray: true,
    required: false,
    description:
      "Return only reports filed by a company in one of the given employee-count buckets. Reads the company's CURRENT bucket, not the one snapshotted on the report.",
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CompanySizeEnum, { each: true })
  employeeCountCategory?: CompanySizeEnum[]

  @ApiProperty({
    enum: CompanySectorEnum,
    enumName: 'CompanySectorEnum',
    isArray: true,
    required: false,
    description:
      'Return only reports filed by a company in one of the given ownership sectors (FYRIRTAEKI, RADUNEYTI, RIKISADILI, SVEITARFELAG). UNKNOWN is filterable on its own and is never folded into a classified sector.',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CompanySectorEnum, { each: true })
  sector?: CompanySectorEnum[]

  @ApiOptionalArray({
    type: String,
    isArray: true,
    description:
      'Return only reports filed by a company in one of the given ÍSAT2008 leaf categories, by code (e.g. "01110"). Reads the admin-owned `company.isatCategoryCode`, not the free-text snapshot on `company_report`.',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsString({ each: true })
  isatCategoryCode?: string[]

  @ApiOptionalArray({
    type: String,
    isArray: true,
    description:
      'Return only reports filed by a company in one of the given ÍSAT2008 sections (bálkur), by letter (e.g. "A"). Upper-cased server-side.',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    const values = Array.isArray(value) ? value : [value]
    return values.map((v) => (typeof v === 'string' ? v.toUpperCase() : v))
  })
  @IsString({ each: true })
  isatSection?: string[]

  @ApiOptionalArray({
    type: String,
    isArray: true,
    description:
      'Return only reports filed by a company located in one of the given regions (landshluti), by region code. Resolved via the company postcode.',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsString({ each: true })
  regionCode?: string[]

  @ApiOptionalArray({
    type: String,
    isArray: true,
    description:
      'Return only reports filed by a company with one of the given postcodes (póstnúmer, e.g. "101").',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsString({ each: true })
  postcode?: string[]

  @ApiOptionalString({
    description:
      'Free-text search across company name, kennitala, and report identifier. Case-insensitive partial match. Person fields (contacts and company admin/CEO) are not searched.',
  })
  q?: string

  @ApiOptionalEnum(ReportSortByEnum, { enumName: 'ReportSortByEnum' })
  sortBy?: ReportSortByEnum

  @ApiOptionalEnum(SortDirectionEnum, { enumName: 'SortDirectionEnum' })
  direction?: SortDirectionEnum
}
