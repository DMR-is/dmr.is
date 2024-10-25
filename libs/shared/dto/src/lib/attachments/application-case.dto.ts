import { ApiProperty } from '@nestjs/swagger'

import { AdvertType } from '../advert-types'
import { CaseStatus } from '../cases'
import { Category } from '../categories'
import { CommunicationStatus } from '../communication-status'
import { Department } from '../departments'

export class ApplicationCase {
  @ApiProperty({
    type: [Category],
  })
  categories!: Category[]

  @ApiProperty({
    enum: CaseStatus,
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
