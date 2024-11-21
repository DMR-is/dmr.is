import { IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class CreateMainAdvertTypeBody {
  @ApiProperty({
    description: 'The department id',
    type: 'string',
    required: true,
  })
  @IsUUID()
  departmentId!: string

  @ApiProperty({
    description: 'The title of the main advert type',
    type: 'string',
    required: true,
  })
  @IsString()
  title!: string
}
