import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export enum SearchAnalyticsInterval {
  Day = 'day',
}

export enum SearchAnalyticsQueryTableType {
  Top = 'top',
  ZeroResults = 'zero_results',
  Slow = 'slow',
}

export class GetSearchAnalyticsQuery {
  @ApiProperty({
    type: String,
    required: false,
    description: 'Inclusive date in YYYY-MM-DD format',
  })
  @IsOptional()
  @IsString()
  from?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'Inclusive date in YYYY-MM-DD format',
  })
  @IsOptional()
  @IsString()
  to?: string
}

export class GetSearchAnalyticsTrendsQuery extends GetSearchAnalyticsQuery {
  @ApiProperty({
    enum: SearchAnalyticsInterval,
    enumName: 'SearchAnalyticsInterval',
    required: false,
  })
  @IsOptional()
  @IsEnum(SearchAnalyticsInterval)
  interval?: SearchAnalyticsInterval
}

export class GetSearchAnalyticsQueriesQuery extends GetSearchAnalyticsQuery {
  @ApiProperty({
    enum: SearchAnalyticsQueryTableType,
    enumName: 'SearchAnalyticsQueryTableType',
  })
  @IsEnum(SearchAnalyticsQueryTableType)
  type!: SearchAnalyticsQueryTableType
}

export class SearchAnalyticsOverviewResponse {
  @ApiProperty({ type: Number })
  @IsNumber()
  totalSearches!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  zeroResultRate!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  withFiltersRate!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  avgDurationMs!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  p95DurationMs!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  pageOneRate!: number
}

export class SearchAnalyticsTrendPoint {
  @ApiProperty({ type: String })
  @IsString()
  date!: string

  @ApiProperty({ type: Number })
  @IsNumber()
  totalSearches!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  zeroResultRate!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  avgDurationMs!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  p95DurationMs!: number
}

export class SearchAnalyticsTrendsResponse {
  @ApiProperty({ type: [SearchAnalyticsTrendPoint] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchAnalyticsTrendPoint)
  points!: SearchAnalyticsTrendPoint[]
}

export class SearchAnalyticsBreakdownItem {
  @ApiProperty({ type: String })
  @IsString()
  key!: string

  @ApiProperty({ type: Number })
  @IsNumber()
  count!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  percentage!: number
}

export class SearchAnalyticsBreakdownsResponse {
  @ApiProperty({ type: [SearchAnalyticsBreakdownItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchAnalyticsBreakdownItem)
  queryKinds!: SearchAnalyticsBreakdownItem[]

  @ApiProperty({ type: [SearchAnalyticsBreakdownItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchAnalyticsBreakdownItem)
  resultBuckets!: SearchAnalyticsBreakdownItem[]

  @ApiProperty({ type: [SearchAnalyticsBreakdownItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchAnalyticsBreakdownItem)
  sortUsage!: SearchAnalyticsBreakdownItem[]

  @ApiProperty({ type: [SearchAnalyticsBreakdownItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchAnalyticsBreakdownItem)
  filterUsage!: SearchAnalyticsBreakdownItem[]
}

export class SearchAnalyticsQueryRow {
  @ApiProperty({ type: String })
  @IsString()
  normalizedQuery!: string

  @ApiProperty({ type: Number })
  @IsNumber()
  count!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  zeroResultRate!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  avgDurationMs!: number

  @ApiProperty({ type: String })
  @IsString()
  resultBucket!: string
}

export class SearchAnalyticsQueriesResponse {
  @ApiProperty({
    enum: SearchAnalyticsQueryTableType,
    enumName: 'SearchAnalyticsQueryTableType',
  })
  @IsEnum(SearchAnalyticsQueryTableType)
  type!: SearchAnalyticsQueryTableType

  @ApiProperty({ type: [SearchAnalyticsQueryRow] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchAnalyticsQueryRow)
  rows!: SearchAnalyticsQueryRow[]
}
