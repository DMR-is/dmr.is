import { IsOptional, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class CreateAdvertTypeBody {
  @ApiProperty({
    type: String,
    description: 'Id of the main type',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  mainTypeId?: string

  @ApiProperty({
    type: String,
    description: 'Id of the department',
  })
  departmentId!: string

  @ApiProperty({
    type: String,
    description: 'Name of the advert type',
  })
  @IsString()
  title!: string
}
