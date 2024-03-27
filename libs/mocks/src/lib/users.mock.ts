import { User } from '@dmr.is/shared/dto'

export const ARMANN: User = {
  id: '3d918322-8e60-44ad-be5e-7485d0e45cdd',
  name: 'Ármann Árni',
  lastName: 'Sigurjónsson',
  active: true,
}

const PALINA: User = {
  id: '3d918322-8e60-44ad-be5e-7485d0e45cde',
  name: 'Pálína J',
  lastName: 'Pálínudóttir',
  active: true,
}

const INACTIVE: User = {
  id: '3d918322-8e60-44ad-be5e-7485d0e45cdb',
  name: 'Jón',
  lastName: 'Jónsson',
  active: false,
}

export const ALL_MOCK_USERS = [ARMANN, PALINA, INACTIVE]
