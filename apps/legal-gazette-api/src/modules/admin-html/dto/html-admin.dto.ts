import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import { ApiOptionalBoolean } from '@dmr.is/decorators'

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

  @ApiProperty({
    description: 'Total number of publications missing HTML',
  })
  total!: number

  @ApiProperty({
    description: 'Number of publications successfully backfilled',
  })
  backfilled!: number

  @ApiProperty({
    description: 'Number of publications that failed',
  })
  failed!: number

  @ApiProperty({
    description: 'Preview items (first page for dry run, empty for backfill)',
    type: [BackfillHtmlItemDto],
  })
  items!: BackfillHtmlItemDto[]

  @ApiProperty({ description: 'Result message' })
  message!: string
}
