import { User } from '@dmr.is/shared/dto'

export const ARMANN: User = {
  id: '3d918322-8e60-44ad-be5e-7485d0e45cdd',
  name: 'Ármann Árni',
  lastName: 'Sigurjónsson',
  active: true,
}

export const REYKJAVIKUR_BORG: User = {
  id: 'd9329178-86c4-4f7b-a876-205e119be739',
  name: 'Reykjavíkurborg',
  lastName: '',
  active: true,
}

export const PALINA: User = {
  id: '21140e6b-e272-4d78-b085-dbc3190b2a0a',
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

export const UNKNOWN_USER: User = {
  id: '3d918322-8e60-44ad-be5e-7485d0e45cdc',
  name: 'Óþekktur notandi',
  lastName: 'notandi',
  active: true,
}

export const ALL_MOCK_USERS = [ARMANN, PALINA, INACTIVE]
