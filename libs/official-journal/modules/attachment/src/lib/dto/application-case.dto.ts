import { ApiProperty } from '@nestjs/swagger'

import {
  CaseStatus,
  CommunicationStatus,
} from '@dmr.is/official-journal/modules/case'
import { AdvertType } from '@dmr.is/official-journal/modules/advert-type'
import { Category, Department } from '@dmr.is/official-journal/modules/journal'

export class ApplicationCase {
  @ApiProperty({
    type: [Category],
  })
  categories!: Category[]

  @ApiProperty({
    type: CaseStatus,
    description: 'Current status of the case',
  })
  status!: CaseStatus

  @ApiProperty({
    type: CommunicationStatus,
  })
  communicationStatus!: CommunicationStatus

  @ApiProperty({
    type: Department,
  })
  department!: Department

  @ApiProperty({
    type: AdvertType,
  })
  type!: AdvertType

  @ApiProperty({
    type: String,
  })
  html!: string
}
