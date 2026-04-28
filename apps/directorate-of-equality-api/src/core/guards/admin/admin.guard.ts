import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { UserModel } from '../../../modules/user/models/user.model'

const LOGGING_CONTEXT = 'AdminGuard'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user as DMRUser

    const adminUser = await this.userModel.findOne({
      where: { nationalId: user.nationalId, isActive: true },
    })

    if (!adminUser) {
      this.logger.warn(
        'Access denied — user not found in doe_user or inactive',
        {
          context: LOGGING_CONTEXT,
          nationalId: user.nationalId,
        },
      )
      throw new ForbiddenException('Access restricted to DoE reviewers')
    }

    request.adminUser = adminUser
    return true
  }
}
