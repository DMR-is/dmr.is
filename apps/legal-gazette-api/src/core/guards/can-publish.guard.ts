import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../models/advert.model'

/**
 * Guard that validates if an advert can be published.
 * Checks if the advert is in a state that allows publishing
 * (READY_FOR_PUBLICATION or IN_PUBLISHING status).
 *
 * Note: This guard only checks advert state. Admin authorization
 * is handled by @AdminAccess() decorator with AuthorizationGuard.
 *
 * Usage: Add @UseGuards(TokenJwtAuthGuard, AuthorizationGuard, CanPublishGuard)
 * with @AdminAccess() to controller methods t hat need publish validation.
 */

@Injectable()
export class CanPublishGuard implements CanActivate {
  constructor(
    @InjectModel(AdvertModel)
    private advertModel: typeof AdvertModel,
    @Inject(LOGGER_PROVIDER) private logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const idToUse = request.params.advertId || request.params.id

    if (!idToUse) {
      this.logger.warn('No advertId or id found in request parameters', {
        context: 'CanPublishGuard',
      })
      return false
    }

    const advert = await this.advertModel.findOne({
      attributes: ['id', 'statusId'],
      where: {
        id: idToUse,
      },
    })

    if (!advert) {
      throw new NotFoundException(`Advert with id ${idToUse} not found`)
    }

    const canPublish = advert.canPublish()

    if (!canPublish) {
      this.logger.warn(
        `Advert with id ${idToUse} is not in a publishable state`,
        { context: 'CanPublishGuard' },
      )
      return false
    }

    return true
  }
}
