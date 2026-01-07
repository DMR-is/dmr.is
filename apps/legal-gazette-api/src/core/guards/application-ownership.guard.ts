import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ApplicationModel } from '../../models/application.model'

/**
 * Guard that validates application ownership.
 * Ensures the authenticated user either:
 * 1. Owns the application (applicantNationalId matches user.nationalId), OR
 * 2. Has admin scope (@logbirtingablad.is/admin)
 *
 * Usage: Add @UseGuards(ApplicationOwnershipGuard) to controller methods
 * that have :applicationId in route params and need ownership validation.
 */
@Injectable()
export class ApplicationOwnershipGuard implements CanActivate {
  constructor(
    @InjectModel(ApplicationModel)
    private applicationModel: typeof ApplicationModel,
    @Inject(LOGGER_PROVIDER) private logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user: DMRUser = request.user
    const { applicationId } = request.params

    if (!applicationId) {
      this.logger.warn('ApplicationId missing from request params', {
        context: 'ApplicationOwnershipGuard',
      })
      throw new NotFoundException('Application ID is required')
    }

    await this.applicationModel.findOneOrThrow({
      where: {
        id: applicationId,
        applicantNationalId: user.nationalId,
      },
    })

    this.logger.debug('Application ownership validated', {
      context: 'ApplicationOwnershipGuard',
      applicationId,
      userNationalId: user.nationalId,
    })

    return true
  }
}
