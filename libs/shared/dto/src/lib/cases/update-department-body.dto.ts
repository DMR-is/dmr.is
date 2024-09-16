import { IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCaseDepartmentBody {
  @ApiProperty({
    type: String,
    description: 'Department id',
  })
  @IsUUID()
  departmentId!: string
}
