import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { Case } from './case.dto'
import { CaseStatus } from './case-status.dto'
import { GetCasesQuery } from './get-cases-query.dto'

export class CaseOverviewTotalItems {
  @ApiProperty({
    type: Number,
    description: 'Total submitted cases',
    required: true,
    example: 7,
  })
  submitted!: number

  @ApiProperty({
    type: Number,
    description: 'Total in progress cases',
    required: true,
    example: 3,
  })
  inProgress!: number

  @ApiProperty({
    type: Number,
    description: 'Total in review cases',
    required: true,
    example: 2,
  })
  inReview!: number

  @ApiProperty({
    type: Number,
    description: 'Total ready cases',
    required: true,
    example: 1,
  })
  ready!: number
}

export class EditorialOverviewResponse {
  @ApiProperty({
    type: [Case],
    description: 'Cases for selected tab',
    required: true,
  })
  cases!: Case[]

  @ApiProperty({
    type: CaseOverviewTotalItems,
    description: 'Total cases for each status',
    required: true,
  })
  totalItems!: CaseOverviewTotalItems

  @ApiProperty({
    type: Paging,
    description: 'Paging information',
    required: true,
  })
  paging!: Paging
}

class Counter {
  @ApiProperty({
    type: Number,
    description: 'Count of the cases',
  })
  count!: number
}

export class CaseOverviewStatus extends IntersectionType(CaseStatus, Counter) {}

export class CaseOverview extends PickType(Case, [
  'id',
  'communicationStatus',
  'requestedPublicationDate',
  'createdAt',
  'advertDepartment',
  'advertType',
  'advertTitle',
  'fastTrack',
  'assignedTo',
  'tag',
]) {}

export class CaseOverviewQuery extends PickType(GetCasesQuery, [
  'search',
  'department',
  'category',
  'type',
  'page',
  'pageSize',
]) {}

export class GetCasesOverview {
  @ApiProperty({
    type: [CaseOverview],
    description: 'Cases for selected tab',
    required: true,
  })
  cases!: CaseOverview[]

  @ApiProperty({
    type: [CaseOverviewStatus],
    description: 'Total cases for each status',
    required: true,
  })
  statuses!: CaseOverviewStatus[]

  @ApiProperty({
    type: Paging,
    description: 'Paging information',
    required: true,
  })
  paging!: Paging
}
