import { Auth } from '@island.is/auth-nest-tools'

export interface DMRUser extends Auth {
  adminUserId?: string
  nationalId: string
  name: string
  fullName: string
  scope: Array<string>
  client: string
  authorization: string
  actor?: {
    nationalId: string
    name: string
    scope: Array<string>
  }
}
