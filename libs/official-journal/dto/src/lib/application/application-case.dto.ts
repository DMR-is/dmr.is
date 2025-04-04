import { ApiProperty } from '@nestjs/swagger'
import { AdvertType } from '../advert-type/advert-type.dto'
import { CaseStatus } from '../case-status/case-status.dto'
import { Category } from '../category/category.dto'
import { CommunicationStatus } from '../communication-status/communication-status.dto'
import { Department } from '../department/department.dto'

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

export class GetApplicationCaseResponse {
  @ApiProperty({
    type: ApplicationCase,
  })
  applicationCase!: ApplicationCase
}
