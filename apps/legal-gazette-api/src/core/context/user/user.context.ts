import { Injectable, Scope } from '@nestjs/common'

import type { DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

@Injectable({ scope: Scope.REQUEST })
export class UserContext {
  user?: DMRUser
}
