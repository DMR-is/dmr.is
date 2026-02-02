import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'

/**
 * Guard that validates if an advert can be published.
 * Checks if the advert is in a state that allows publishing
 * (READY_FOR_PUBLICATION or IN_PUBLISHING status).
 *
 * Supports both direct advert routes and nested resource routes:
 * - Direct: /adverts/:advertId (uses advertId or id param)
 * - Nested: /publications/:publicationId (looks up advertId via publication)
 *
 * Note: This guard only checks advert state, NOT user assignment.
 * Admin authorization is handled by @AdminAccess() decorator with AuthorizationGuard.
 *
 * Usage: Add @UseGuards(TokenJwtAuthGuard, AuthorizationGuard, CanPublishGuard)
 * with @AdminAccess() to controller methods that need publish validation.
 */

@Injectable()
export class CanPublishGuard implements CanActivate {
  constructor(
    @InjectModel(AdvertModel)
    private advertModel: typeof AdvertModel,
    @InjectModel(AdvertPublicationModel)
    private advertPublicationModel: typeof AdvertPublicationModel,
    @Inject(LOGGER_PROVIDER) private logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Try to get advertId from different sources
    const advertId = await this.resolveAdvertId(request.params)

    if (!advertId) {
      this.logger.warn(
        'No advertId, id, or publicationId provided in request',
        {
          context: 'CanPublishGuard',
          params: Object.keys(request.params),
        },
      )
      return false
    }

    const advert = await this.advertModel.findOne({
      attributes: ['id', 'statusId'],
      where: {
        id: advertId,
      },
    })

    if (!advert) {
      throw new NotFoundException(`Advert not found`)
    }

    const canPublish = advert.canPublish()

    if (!canPublish) {
      this.logger.warn(`Advert is not in a publishable state`, {
        context: 'CanPublishGuard',
        advertId,
        status: advert.statusId,
      })
      throw new ForbiddenException(
        `Advert cannot be published in its current state`,
      )
    }

    this.logger.debug(`Publish access granted for advert ${advertId}`, {
      context: 'CanPublishGuard',
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
              context: 'CanPublishGuard',
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
            context: 'CanPublishGuard',
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
            context: 'CanPublishGuard',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        )
        throw error
      }
    }

    return null
  }
}
