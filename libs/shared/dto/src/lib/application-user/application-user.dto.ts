import { ApiProperty } from '@nestjs/swagger'

import { Institution } from '../institutions'

export class ApplicationUser {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The user id',
  })
  id!: string

  @ApiProperty({
    type: String,
    required: true,
    description: 'The user national id',
  })
  nationalId!: string

  @ApiProperty({
    type: String,
    required: true,
    description: 'The user first name',
  })
  firstName!: string

  @ApiProperty({
    type: String,
    required: true,
    description: 'The user last name',
  })
  lastName!: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'The user email',
  })
  email?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'The user phone',
  })
  phone?: string

  @ApiProperty({
    type: [Institution],
    required: true,
  })
  involvedParties!: Institution[]
}
