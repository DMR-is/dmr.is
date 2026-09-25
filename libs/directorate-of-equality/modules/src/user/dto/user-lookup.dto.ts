import { ApiBoolean, ApiString } from '@dmr.is/decorators'

/**
 * A person as the national registry names them, for pre-filling a new user.
 *
 * The registry holds one full name; `firstName` / `lastName` are that name
 * split at its last space — for Icelandic names the patronymic or family name
 * is last, so this is right for all but unusual cases. `name` is returned too
 * so the web can show what the split was made from.
 *
 * No email or phone: the registry holds neither, so an admin always types them.
 */
export class UserLookupDto {
  @ApiString()
  nationalId!: string

  @ApiString({ description: 'Full name as the national registry records it.' })
  name!: string

  @ApiString()
  firstName!: string

  @ApiString({
    description: 'Empty when the registry name is a single word.',
  })
  lastName!: string

  @ApiBoolean({
    description:
      'A user with this kennitala already exists (active or not), so creating another would be refused with a 409.',
  })
  alreadyUser!: boolean
}
