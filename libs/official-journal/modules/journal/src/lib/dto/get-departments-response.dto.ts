import { ApiProperty } from '@nestjs/swagger'

import { Department } from './department.dto'
import { Paging } from '@dmr.is/shared/dto'

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
