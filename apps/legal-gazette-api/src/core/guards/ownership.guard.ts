import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type DMRUser } from '@dmr.is/auth/dmrUser'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../models/advert.model'
import { ApplicationModel } from '../../models/application.model'
import { CaseModel } from '../../models/case.model'

/**
 * Guard that validates application ownership.
 * Ensures the authenticated user either:
 * 1. Owns the application (applicantNationalId matches user.nationalId), OR
 * 2. Has admin scope (@logbirtingablad.is/admin)
 *
 * Usage: Add @UseGuards(ApplicationOwnershipGuard) to controller methods
 * that have :applicationId in route params and need ownership validation.
 */

type Params = {
  [key: string]: string | undefined
}
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    @InjectModel(ApplicationModel)
    private applicationModel: typeof ApplicationModel,
    @InjectModel(AdvertModel)
    private advertModel: typeof AdvertModel,
    @InjectModel(CaseModel)
    private caseModel: typeof CaseModel,
    @Inject(LOGGER_PROVIDER) private logger: Logger,
  ) {}

  private getModelAndId(params: Params) {
    if (params.applicationId) {
      return { model: 'applicationModel', id: params.applicationId }
    }
    if (params.advertId) {
      return { model: 'advertModel', id: params.advertId }
    }
    if (params.caseId) {
      return { model: 'caseModel', id: params.caseId }
    }
    return null
  }

  private getResource(model: string, resourceId: string) {
    switch (model) {
      case 'applicationModel':
        return this.applicationModel.findOne({
          where: {
            id: resourceId,
          },
          attributes: ['id', 'applicantNationalId'],
        })
      case 'advertModel':
        return this.advertModel.findOne({
          where: {
            id: resourceId,
          },
          attributes: ['id', 'createdByNationalId'],
        })
      case 'caseModel':
        // Currently only used by admins
        return this.caseModel.findOne({
          where: {
            id: resourceId,
          },
          attributes: ['id'],
        })
      default:
        return null
    }
  }

  private isOwner(
    user: DMRUser,
    resource: AdvertModel | ApplicationModel | CaseModel,
  ): boolean {
    if ('applicantNationalId' in resource) {
      return resource.applicantNationalId === user.nationalId
    }
    if ('createdByNationalId' in resource) {
      return resource.createdByNationalId === user.nationalId
    }

    return false
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user: DMRUser = request.user

    const modelAndId = this.getModelAndId(request.params as Params)

    if (!modelAndId?.id) {
      this.logger.warn('Id missing from request params', {
        context: 'OwnershipGuard',
      })
      throw new NotFoundException('Resource Not Found')
    }
    const { model: resourceModel, id: resourceId } = modelAndId

    const resource = await this.getResource(resourceModel, resourceId)

    if (!resource) {
      this.logger.warn('Resource Not Found', {
        context: 'OwnershipGuard',
        resourceId,
      })
      throw new NotFoundException('Resource Not Found')
    }

    if (!this.isOwner(user, resource) && !user.adminUserId) {
      this.logger.warn('User is not owner or admin of the resource', {
        context: 'OwnershipGuard',
        resourceId,
        userNationalId: user.nationalId,
      })
      throw new NotFoundException('Resource Not Found')
    }

    this.logger.debug('Ownership validated', {
      context: 'OwnershipGuard',
      resourceId,
      isAdmin: !!user.adminUserId,
      userNationalId: user.nationalId,
    })

    return true
  }
}
