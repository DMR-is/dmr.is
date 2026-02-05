import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'

/**
 * Guard that validates if multiple adverts can be published.
 * Checks if all adverts in the request are in a state that allows publishing
 * (READY_FOR_PUBLICATION or IN_PUBLISHING status).
 *
 * Note: This guard only checks advert state. Admin authorization
 * is handled by @AdminAccess() decorator with AuthorizationGuard.
 *
 * Usage: Add @UseGuards(TokenJwtAuthGuard, AuthorizationGuard, CanPublishBulkGuard)
 * with @AdminAccess() to controller methods that need bulk publish validation.
 * Expects request body to contain an 'advertIds' array field.
 */

@Injectable()
export class CanPublishBulkGuard implements CanActivate {
  constructor(
    @InjectModel(AdvertModel)
    private advertModel: typeof AdvertModel,
    @Inject(LOGGER_PROVIDER) private logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const advertIds: string[] = request.body?.advertIds

    if (!advertIds || !Array.isArray(advertIds)) {
      this.logger.warn('No advertIds array found in request body', {
        context: 'CanPublishBulkGuard',
      })
      throw new BadRequestException(
        'Request body must contain an advertIds array',
      )
    }

    if (advertIds.length === 0) {
      this.logger.warn('Empty advertIds array provided', {
        context: 'CanPublishBulkGuard',
      })
      throw new BadRequestException('advertIds array cannot be empty')
    }

    // Fetch all adverts in one query
    const adverts = await this.advertModel.findAll({
      attributes: ['id', 'statusId'],
      where: {
        id: advertIds,
      },
    })

    // Check if all adverts were found
    if (adverts.length !== advertIds.length) {
      const foundIds = adverts.map((a) => a.id)
      const missingIds = advertIds.filter((id) => !foundIds.includes(id))

      this.logger.warn('Some adverts not found', {
        context: 'CanPublishBulkGuard',
        missingIds,
      })

      throw new NotFoundException(`Adverts not found: ${missingIds.join(', ')}`)
    }

    // Check if all adverts can be published
    const unpublishableAdverts = adverts.filter(
      (advert) => !advert.canPublish(),
    )

    if (unpublishableAdverts.length > 0) {
      const unpublishableIds = unpublishableAdverts.map((a) => a.id)

      this.logger.warn('Some adverts are not in a publishable state', {
        context: 'CanPublishBulkGuard',
        unpublishableIds,
        statuses: unpublishableAdverts.map((a) => ({
          id: a.id,
          status: a.statusId,
        })),
      })

      throw new BadRequestException(
        `The following adverts are not in a publishable state: ${unpublishableIds.join(', ')}`,
      )
    }

    this.logger.info(
      `All ${advertIds.length} adverts are in a publishable state`,
      { context: 'CanPublishBulkGuard', count: advertIds.length },
    )

    return true
  }
}
