import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertGuardUtils } from './advert-guard-utils.module'

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
    private advertGuardUtils: AdvertGuardUtils,
    @Inject(LOGGER_PROVIDER) private logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Try to get advertId from different sources
    const advertId = await this.advertGuardUtils.resolveAdvertId(
      request.params,
      'CanPublishGuard',
    )

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
}
