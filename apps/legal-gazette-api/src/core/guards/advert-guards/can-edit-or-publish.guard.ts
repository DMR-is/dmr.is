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
 * Guard that checks if user can either edit OR publish an advert.
 * Supports both direct advert routes (advertId/id params) and nested publication routes (publicationId param).
 *
 * For edit: User must be assigned to the advert (checked via canEdit())
 * For publish: Advert must be in publishable state (READY_FOR_PUBLICATION or IN_PUBLISHING)
 *
 * The guard passes if EITHER condition is met (OR logic).
 *
 * Parameter priority: advertId > id > publicationId
 *
 * Usage: Add @UseGuards(TokenJwtAuthGuard, AuthorizationGuard, CanEditOrPublishGuard)
 * to controller methods that allow either editing or publishing operations.
 */
@Injectable()
export class CanEditOrPublishGuard implements CanActivate {
  constructor(
    @InjectModel(AdvertModel)
    private advertModel: typeof AdvertModel,
    @InjectModel(AdvertPublicationModel)
    private advertPublicationModel: typeof AdvertPublicationModel,
    @Inject(LOGGER_PROVIDER)
    private readonly logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user as DMRUser | undefined

    // Try to get advertId from different sources
    const advertId = await this.resolveAdvertId(request.params)

    if (!advertId) {
      this.logger.warn(
        'No advertId, id, or publicationId provided in request',
        {
          context: 'CanEditOrPublishGuard',
          params: Object.keys(request.params),
        },
      )
      return false
    }

    const advert = await this.advertModel.findOne({
      attributes: ['id', 'statusId', 'assignedUserId'],
      where: {
        id: advertId,
      },
    })

    if (!advert) {
      throw new NotFoundException(`Advert with id ${advertId} not found`)
    }

    // Check if user can edit (requires assignment)
    const canEdit = user?.adminUserId ? advert.canEdit(user.adminUserId) : false

    // Check if advert can be published (no assignment required)
    const canPublish = advert.canPublish()

    // Pass if EITHER condition is met
    if (canEdit || canPublish) {
      this.logger.debug(
        `Access granted for advert ${advertId} (canEdit: ${canEdit}, canPublish: ${canPublish})`,
        {
          context: 'CanEditOrPublishGuard',
          advertId,
          canEdit,
          canPublish,
        },
      )
      return true
    }

    // Neither condition met - deny access
    this.logger.warn(
      `Access denied for advert ${advertId}. User cannot edit (not assigned) and advert is not publishable (status: ${advert.statusId})`,
      {
        context: 'CanEditOrPublishGuard',
        advertId,
        status: advert.statusId,
        adminUserId: user?.adminUserId,
      },
    )

    throw new ForbiddenException(
      `Cannot perform this operation. User must be assigned to the advert or advert must be in publishable state`,
    )
  }

  /**
   * Resolves advertId from request parameters with priority:
   * 1. advertId (direct parameter)
   * 2. id (alternative direct parameter)
   * 3. publicationId (needs lookup via AdvertPublicationModel)
   */
  private async resolveAdvertId(
    params: Record<string, string>,
  ): Promise<string | null> {
    // Priority 1: Direct advertId
    if (params.advertId) {
      this.logger.debug('Using advertId from params', {
        context: 'CanEditOrPublishGuard',
        advertId: params.advertId,
      })
      return params.advertId
    }

    // Priority 2: Alternative id parameter
    if (params.id) {
      this.logger.debug('Using id from params as advertId', {
        context: 'CanEditOrPublishGuard',
        advertId: params.id,
      })
      return params.id
    }

    // Priority 3: Resolve from publicationId
    if (params.publicationId) {
      this.logger.debug('Resolving advertId from publicationId', {
        context: 'CanEditOrPublishGuard',
        publicationId: params.publicationId,
      })

      const publication = await this.advertPublicationModel.findOne({
        attributes: ['advertId'],
        where: { id: params.publicationId },
      })

      if (!publication) {
        throw new NotFoundException(
          `Publication with id ${params.publicationId} not found`,
        )
      }

      this.logger.debug('Resolved advertId from publication', {
        context: 'CanEditOrPublishGuard',
        publicationId: params.publicationId,
        advertId: publication.advertId,
      })

      return publication.advertId
    }

    return null
  }
}
