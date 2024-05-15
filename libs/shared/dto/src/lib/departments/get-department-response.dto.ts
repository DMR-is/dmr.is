import { ApiProperty } from '@nestjs/swagger'

import { Department } from './department.dto'

export class GetDepartmentResponse {
  @ApiProperty({
    type: Department,
    description: 'The department that was found.',
  })
  readonly department!: Department
}
