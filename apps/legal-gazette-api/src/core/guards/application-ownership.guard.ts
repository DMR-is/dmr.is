import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
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

    const application = await this.applicationModel.findByPk(applicationId)

    if (!application) {
      this.logger.warn('Application not found', {
        context: 'ApplicationOwnershipGuard',
        applicationId,
        userNationalId: user?.nationalId,
      })
      throw new NotFoundException(
        `Application with id ${applicationId} not found`,
      )
    }

    // Check if user is admin (has admin scope)
    const isAdmin = user?.scope?.includes('@logbirtingablad.is/admin') ?? false

    // Check if user owns the application
    const isOwner = application.applicantNationalId === user?.nationalId

    if (!isAdmin && !isOwner) {
      this.logger.warn('User attempted to access application they do not own', {
        context: 'ApplicationOwnershipGuard',
        applicationId,
        userNationalId: user?.nationalId,
        applicantNationalId: application.applicantNationalId,
      })
      throw new ForbiddenException(
        'You do not have permission to access this application',
      )
    }

    this.logger.debug('Application ownership validated', {
      context: 'ApplicationOwnershipGuard',
      applicationId,
      userNationalId: user.nationalId,
      isAdmin,
      isOwner,
    })

    return true
  }
}
