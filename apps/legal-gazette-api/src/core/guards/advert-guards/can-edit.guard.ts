import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type DMRUser } from '@dmr.is/auth/dmrUser'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertGuardUtils } from './advert-guard-utils.module'

/**
 * Guard that validates if an advert can be edited by the current user.
 * Checks if the advert is in an editable state and if the user is assigned to it.
 *
 * Supports both direct advert routes and nested resource routes:
 * - Direct: /adverts/:advertId (uses advertId or id param)
 * - Nested: /publications/:publicationId (looks up advertId via publication)
 *
 * Note: This guard checks both advert state AND user assignment.
 * Admin authorization is handled by @AdminAccess() decorator with AuthorizationGuard.
 *
 * Usage: Add @UseGuards(TokenJwtAuthGuard, AuthorizationGuard, CanEditGuard)
 * with @AdminAccess() to controller methods that need edit validation.
 */

@Injectable()
export class CanEditGuard implements CanActivate {
  constructor(
    @InjectModel(AdvertModel)
    private advertModel: typeof AdvertModel,
    private advertGuardUtils: AdvertGuardUtils,
    @Inject(LOGGER_PROVIDER) private logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user: DMRUser = request.user

    const adminId = user?.adminUserId

    if (!adminId) {
      this.logger.warn('Admin user id not found on authenticated user', {
        context: 'CanEditGuard',
      })
      return false
    }

    // Try to get advertId from different sources
    const advertId = await this.advertGuardUtils.resolveAdvertId(
      request.params,
      'CanEditGuard',
    )

    if (!advertId) {
      this.logger.warn(
        'No advertId, id, or publicationId found in request parameters',
        {
          context: 'CanEditGuard',
          params: Object.keys(request.params),
        },
      )
      return false
    }

    // Fetch the advert
    const advert = await this.advertModel.findOne({
      attributes: ['id', 'statusId', 'assignedUserId'],
      where: {
        id: advertId,
      },
    })

    if (!advert) {
      throw new NotFoundException(`Advert with id ${advertId} not found`)
    }

    // Check if user can edit
    const canEdit = advert.canEdit(adminId)

    if (!canEdit) {
      this.logger.warn(
        `User ${adminId} cannot edit advert ${advertId}. Status: ${advert.statusId}, Assigned to: ${advert.assignedUserId}`,
        {
          context: 'CanEditGuard',
          adminId,
          advertId,
          status: advert.statusId,
          assignedUserId: advert.assignedUserId,
        },
      )
      throw new ForbiddenException(
        'You do not have permission to edit this advert',
      )
    }

    this.logger.debug(`Edit access granted for advert ${advertId}`, {
      context: 'CanEditGuard',
      adminId,
      advertId,
    })

    return true
  }
}
