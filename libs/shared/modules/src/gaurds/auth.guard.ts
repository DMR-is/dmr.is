import { decode } from 'jsonwebtoken'
import { Sequelize } from 'sequelize-typescript'
import { ResultWrapper } from '@dmr.is/types'

import { CanActivate, ExecutionContext, Inject } from '@nestjs/common'

import { IApplicationUserService } from '../application-user/application-user.module'

export class AuthGuard implements CanActivate {
  constructor(
    @Inject(IApplicationUserService)
    private readonly applicationUserService: IApplicationUserService,
    private readonly sequelize: Sequelize,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = request.headers.token

    const user = decode(token)

    if (!user || typeof user === 'string') {
      return false
    }

    const nationalId = user.nationalId

    if (!nationalId) {
      return false
    }

    request.nationalId = nationalId

    // lookup user and find out if they are allowed to access the resource
    try {
      const userLookup = ResultWrapper.unwrap(
        await this.applicationUserService.getUser(nationalId),
      )

      const { user } = userLookup

      request.user = user

      return true
    } catch (error) {
      // user does not exists

      return false
    }
  }
}
