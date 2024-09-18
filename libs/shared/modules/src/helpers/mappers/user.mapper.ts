import { ARMANN, PALINA, REYKJAVIKUR_BORG, UNKNOWN_USER } from '@dmr.is/mocks'

export const userMapper = (id?: string | null) => {
  if (!id) return null

  switch (id) {
    case ARMANN.id:
      return ARMANN.name
    case REYKJAVIKUR_BORG.id:
      return REYKJAVIKUR_BORG.name
    case PALINA.id:
      return PALINA.name
    default:
      return UNKNOWN_USER.name
  }
}
