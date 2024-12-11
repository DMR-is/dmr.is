import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'

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
  email!: string

  @ApiProperty({
    type: [Institution],
    required: true,
  })
  involvedParties!: Institution[]
}

export class CreateApplicationUser extends OmitType(ApplicationUser, [
  'id',
  'involvedParties',
]) {
  @ApiProperty({
    type: [String],
  })
  involvedPartyIds!: string[]
}

export class UpdateApplicationUser extends PartialType(
  OmitType(CreateApplicationUser, ['nationalId']),
) {}

export class GetApplicationUser {
  @ApiProperty({
    type: ApplicationUser,
  })
  user!: ApplicationUser
}

export class GetApplicationUsers {
  @ApiProperty({
    type: [ApplicationUser],
  })
  users!: ApplicationUser[]
}
