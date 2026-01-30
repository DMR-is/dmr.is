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

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'

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
    @InjectModel(AdvertPublicationModel)
    private advertPublicationModel: typeof AdvertPublicationModel,
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
    const advertId = await this.resolveAdvertId(request.params)

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

  /**
   * Resolves the advertId from request parameters.
   * Handles three cases:
   * 1. Direct advertId parameter
   * 2. Generic id parameter (used in some routes)
   * 3. publicationId parameter (nested resource - requires lookup)
   */
  private async resolveAdvertId(
    params: Record<string, string>,
  ): Promise<string | null> {
    // Case 1: Direct advertId parameter
    if (params.advertId) {
      return params.advertId
    }

    // Case 2: Generic id parameter
    if (params.id) {
      return params.id
    }

    // Case 3: publicationId parameter - need to lookup advertId
    if (params.publicationId) {
      try {
        const publication = await this.advertPublicationModel.findOne({
          attributes: ['advertId'],
          where: { id: params.publicationId },
        })

        if (!publication) {
          this.logger.warn(
            `Publication ${params.publicationId} not found during advertId resolution`,
            {
              context: 'CanEditGuard',
              publicationId: params.publicationId,
            },
          )
          throw new NotFoundException(
            `Publication with id ${params.publicationId} not found`,
          )
        }

        this.logger.debug(
          `Resolved advertId ${publication.advertId} from publicationId ${params.publicationId}`,
          {
            context: 'CanEditGuard',
            publicationId: params.publicationId,
            advertId: publication.advertId,
          },
        )

        return publication.advertId
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error
        }
        this.logger.error(
          `Error resolving advertId from publicationId ${params.publicationId}`,
          {
            context: 'CanEditGuard',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        )
        throw error
      }
    }

    return null
  }
}
