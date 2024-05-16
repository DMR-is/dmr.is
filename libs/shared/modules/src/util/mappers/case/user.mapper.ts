import { ARMANN, REYKJAVIKUR_BORG } from '@dmr.is/mocks'

export const userMapper = (id?: string | null) => {
  if (!id) return null

  switch (id) {
    case ARMANN.id:
      return ARMANN.name
    case REYKJAVIKUR_BORG.id:
      return REYKJAVIKUR_BORG.name
  }

  return null
}
