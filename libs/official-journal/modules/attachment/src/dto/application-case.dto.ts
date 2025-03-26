import { ApiProperty } from '@nestjs/swagger'

import { AdvertType } from '../advert-type'
import { CaseStatus } from '../cases/case-status.dto'
import { Category } from '../categories'
import { CommunicationStatus } from '../communication-status'
import { Department } from '../departments'

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
