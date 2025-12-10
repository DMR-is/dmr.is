import { Auth } from '@island.is/auth-nest-tools'

export interface DMRUser extends Auth {
  nationalId: string
  name: string
  fullName: string
  scope: string[]
  client: string
  authorization: string
  actor?: {
    nationalId: string
    name: string
    scope: string[]
  }
}
