import { ApiProperty } from '@nestjs/swagger'
import { JournalAdvertDepartment } from './journal-department.dto'
import { Paging } from '../../common'

export class JournalAdvertDepartmentsResponse {
  @ApiProperty({
    description: 'List of advert epartments',
    required: true,
    type: [JournalAdvertDepartment],
  })
  readonly departments!: Array<JournalAdvertDepartment>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: Paging,
  })
  readonly paging!: Paging
}
