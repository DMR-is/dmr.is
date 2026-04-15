import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import { ApiOptionalBoolean, ApiOptionalNumber } from '@dmr.is/decorators'

export class BackfillHtmlQueryDto {
  @ApiOptionalBoolean({
    description: 'If true, no changes are persisted to the database',
  })
  dryRun?: boolean
}

export class BackfillHtmlItemDto {
  @ApiProperty({ description: 'Publication ID' })
  publicationId!: string

  @ApiProperty({ description: 'Advert ID' })
  advertId!: string

  @ApiProperty({ description: 'Advert title' })
  title!: string

  @ApiProperty({ description: 'Advert type title' })
  type!: string

  @ApiProperty({ description: 'Publication version letter (A, B, C)' })
  version!: string

  @ApiProperty({ description: 'Whether HTML generation succeeded' })
  success!: boolean

  @ApiPropertyOptional({ description: 'Error message if generation failed' })
  error?: string
}

export class BackfillHtmlResponseDto {
  @ApiProperty({ description: 'Whether this was a dry run' })
  dryRun!: boolean

  @ApiProperty({ description: 'Total number of publications missing HTML' })
  total!: number

  @ApiProperty({ description: 'Number of publications successfully backfilled' })
  backfilled!: number

  @ApiProperty({ description: 'Number of publications that failed' })
  failed!: number

  @ApiProperty({
    description: 'Preview items (first page for dry run)',
    type: [BackfillHtmlItemDto],
  })
  items!: BackfillHtmlItemDto[]

  @ApiProperty({ description: 'Result message' })
  message!: string
}

export class BackfillJobStatusDto {
  @ApiProperty({
    description: 'Job status',
    enum: ['idle', 'running', 'completed', 'failed'],
  })
  status!: 'idle' | 'running' | 'completed' | 'failed'

  @ApiProperty({ description: 'Total publications to process' })
  total!: number

  @ApiProperty({ description: 'Successfully processed count' })
  completed!: number

  @ApiProperty({ description: 'Failed count' })
  failed!: number

  @ApiProperty({ description: 'Current batch number' })
  currentBatch!: number

  @ApiProperty({ description: 'Total number of batches' })
  totalBatches!: number

  @ApiPropertyOptional({ description: 'ISO timestamp when job started' })
  startedAt?: string

  @ApiPropertyOptional({ description: 'ISO timestamp when job finished' })
  finishedAt?: string

  @ApiPropertyOptional({ description: 'Status message' })
  message?: string
}

export class BackfillStartResponseDto {
  @ApiProperty({ description: 'Whether the job was started' })
  started!: boolean

  @ApiPropertyOptional({ description: 'Info message' })
  message?: string

  @ApiProperty({ description: 'Current job status', type: BackfillJobStatusDto })
  status!: BackfillJobStatusDto
}

export class BackfilledPublicationItemDto {
  @ApiProperty({ description: 'Backfill record ID' })
  id!: string

  @ApiProperty({ description: 'Publication ID' })
  publicationId!: string

  @ApiProperty({ description: 'Advert title' })
  title!: string

  @ApiProperty({ description: 'Advert type' })
  type!: string

  @ApiProperty({ description: 'Publication version letter' })
  version!: string

  @ApiProperty({ description: 'When backfill was performed' })
  backfilledAt!: string
}

export class BackfilledPublicationsQueryDto {
  @ApiOptionalNumber({ description: 'Page number', default: 1 })
  page?: number

  @ApiOptionalNumber({ description: 'Page size', default: 50 })
  pageSize?: number
}

export class BackfilledPublicationsListDto {
  @ApiProperty({
    description: 'Backfilled publication items',
    type: [BackfilledPublicationItemDto],
  })
  items!: BackfilledPublicationItemDto[]

  @ApiProperty({ description: 'Total count' })
  total!: number

  @ApiProperty({ description: 'Current page' })
  page!: number

  @ApiProperty({ description: 'Page size' })
  pageSize!: number
}
