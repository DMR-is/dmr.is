import { ApiProperty } from '@nestjs/swagger'

import { BaseEntity } from '../entity'
import { Paging, PagingQuery } from '../paging'

export class ApplicationAdvertItem {
  @ApiProperty({
    type: String,
    description: 'Unique ID for the advert.',
  })
  id!: string

  @ApiProperty({
    type: String,
    description: 'Title of the advert.',
  })
  title!: string

  @ApiProperty({
    type: BaseEntity,
    description: 'The department the advert is for.',
  })
  department!: BaseEntity

  @ApiProperty({
    type: BaseEntity,
    description: 'Type of the advert.',
  })
  type!: BaseEntity

  @ApiProperty({
    type: BaseEntity,
    description: 'Main type for the advert type',
    nullable: true,
  })
  mainType!: BaseEntity | null

  @ApiProperty({
    type: String,
    description: 'HTML content of the advert',
  })
  html!: string

  @ApiProperty({
    type: [BaseEntity],
    description: 'List of categories for the advert',
  })
  categories!: BaseEntity[]
}

export class GetApplicationAdverts {
  @ApiProperty({
    type: [ApplicationAdvertItem],
    description: 'List of adverts',
  })
  adverts!: ApplicationAdvertItem[]

  @ApiProperty({
    type: Paging,
    description: 'Paging information',
  })
  paging!: Paging
}

export class GetApplicationAdvertsQuery extends PagingQuery {
  @ApiProperty({
    type: String,
    description: 'Search',
    required: false,
  })
  search?: string
}
