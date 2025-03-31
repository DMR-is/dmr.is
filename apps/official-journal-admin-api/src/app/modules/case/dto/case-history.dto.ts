import { AdvertType } from '@dmr.is/official-journal/modules/advert-type'
import { Department } from '@dmr.is/official-journal/modules/department'
import { Institution } from '@dmr.is/official-journal/modules/institution'
import { UserDto } from '@dmr.is/official-journal/modules/user'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { CaseStatus } from './case-status.dto'

const BASE_ATTRIBUTES = ['id', 'title', 'slug'] as const

class HistoryDepartment extends PickType(Department, BASE_ATTRIBUTES) {}

class HistoryType extends PickType(AdvertType, BASE_ATTRIBUTES) {}

class HistoryStatus extends PickType(CaseStatus, BASE_ATTRIBUTES) {}

class HistoryInstition extends PickType(Institution, BASE_ATTRIBUTES) {}

class HistoryEmployee extends PickType(UserDto, [
  'id',
  'displayName',
] as const) {}

export class CaseHistory {
  @ApiProperty({
    type: String,
    description: 'Id of the history record.',
  })
  id!: string

  @ApiProperty({
    type: String,
    description: 'Id of the case the history record is related to.',
  })
  caseId!: string

  @ApiProperty({
    type: HistoryDepartment,
    description: 'Department the case was submitted to.',
  })
  department!: HistoryDepartment

  @ApiProperty({
    type: HistoryType,
    description: 'Type of the advert the case is related to.',
  })
  type!: HistoryType

  @ApiProperty({
    type: HistoryStatus,
    description: 'Status of the case.',
  })
  status!: HistoryStatus

  @ApiProperty({
    type: HistoryInstition,
    description: 'Institution the case was submitted to.',
  })
  institution!: HistoryInstition

  @ApiProperty({
    type: HistoryEmployee,
    description: 'Employee the case was assigned to.',
    nullable: true,
  })
  assignedTo!: HistoryEmployee | null

  @ApiProperty({
    type: String,
    description: 'Title of the advert',
  })
  title!: string

  @ApiProperty({
    type: String,
    description: 'HTML of the advert',
  })
  html!: string

  @ApiProperty({
    type: String,
    description: 'Requested publication date of the advert',
    nullable: true,
  })
  requestedPublicationDate!: string | null

  @ApiProperty({
    type: String,
    description: 'ISO representation of the date the case was created.',
  })
  created!: string
}
