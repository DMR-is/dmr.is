import { ApiProperty } from '@nestjs/swagger'
import { JournalPaging } from '../journal-paging.dto'
import { JournalAdvertDepartment } from './journal-department.dto'

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
    type: JournalPaging,
  })
  readonly paging!: JournalPaging
}
