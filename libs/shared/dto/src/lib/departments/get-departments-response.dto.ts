import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { Department } from './department.dto'

export class GetDepartmentsResponse {
  @ApiProperty({
    description: 'List of departments',
    required: true,
    type: [Department],
  })
  readonly departments!: Array<Department>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: Paging,
  })
  readonly paging!: Paging
}
