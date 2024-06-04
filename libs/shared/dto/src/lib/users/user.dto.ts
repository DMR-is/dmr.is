import { ApiProperty } from '@nestjs/swagger'

export class User {
  @ApiProperty({
    description: 'Unique ID for the user, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  readonly id!: string

  @ApiProperty({
    description: 'First name of the user.',
    example: 'Jón Gunnar',
    required: true,
    type: String,
  })
  name!: string

  @ApiProperty({
    description: 'Last name of the user.',
    example: 'Jónsson',
    required: true,
    type: String,
  })
  lastName!: string

  @ApiProperty({
    description: 'Status of the user',
    example: true,
    required: true,
    type: Boolean,
  })
  active!: boolean
}
