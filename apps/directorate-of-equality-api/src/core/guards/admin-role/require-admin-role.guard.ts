import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { UserModel } from '../../../modules/user/models/user.model'
import { DoeUserRole } from '../../../modules/user/types/user-role'

@Injectable()
export class RequireAdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const adminUser = request.adminUser as UserModel | undefined

    if (!adminUser) {
      throw new InternalServerErrorException(
        'RequireAdminRoleGuard ran without AdminGuard — fix the @UseGuards order',
      )
    }

    if (adminUser.role !== DoeUserRole.ADMIN) {
      throw new ForbiddenException('Admin role required')
    }

    return true
  }
}
