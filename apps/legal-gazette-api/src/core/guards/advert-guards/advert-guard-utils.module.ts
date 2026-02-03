import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertPublicationModel } from '../../../models/advert-publication.model'

/**
 * Utility service for advert guard operations.
 * Provides shared functionality for resolving advertIds from request parameters.
 */
@Injectable()
export class AdvertGuardUtils {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertPublicationModel)
    private advertPublicationModel: typeof AdvertPublicationModel,
  ) {}

  /**
   * Resolves the advertId from request parameters using descriptive parameter names.
   * Handles four cases:
   * 1. Direct advertId parameter
   * 2. Generic id parameter (fallback for routes using @Param('id'))
   * 3. publicationId parameter (nested resource - requires lookup)
   * 4. commentId parameter (requires lookup through publication)
   *
   * @param params - Request parameters object
   * @param context - Context string for logging (e.g., guard name)
   * @returns The resolved advertId or null if not found
   * @throws NotFoundException if publicationId/commentId is provided but not found
   */
  async resolveAdvertId(
    params: {
      advertId?: string
      id?: string
      publicationId?: string
      commentId?: string
    },
    context: string,
  ): Promise<string | null> {
    // Case 1: Direct advertId parameter
    if (params.advertId) {
      this.logger.debug(`Resolved advertId directly from params`, {
        context,
        advertId: params.advertId,
      })
      return params.advertId
    }

    // Case 2: Generic id parameter (used by most routes with @Param('id'))
    if (params.id) {
      this.logger.debug(`Resolved advertId from id parameter`, {
        context,
        advertId: params.id,
      })
      return params.id
    }

    // Case 3: publicationId parameter - lookup advertId
    if (params.publicationId) {
      return this.resolveAdvertIdFromPublication(params.publicationId, context)
    }

    // Case 4: commentId parameter - lookup through publication (if needed in future)
    if (params.commentId) {
      this.logger.warn(`commentId resolution not yet implemented`, {
        context,
        commentId: params.commentId,
      })
      return null
    }

    return null
  }

  /**
   * Resolves advertId by looking up a publication.
   *
   * @param publicationId - The publication ID to lookup
   * @param context - Context string for logging
   * @returns The advertId from the publication
   * @throws NotFoundException if publication is not found
   */
  private async resolveAdvertIdFromPublication(
    publicationId: string,
    context: string,
  ): Promise<string> {
    try {
      const publication = await this.advertPublicationModel.findOne({
        attributes: ['advertId'],
        where: { id: publicationId },
      })

      if (!publication) {
        this.logger.warn(`Publication not found during advertId resolution`, {
          context,
          publicationId,
        })
        throw new NotFoundException(
          `Publication with id ${publicationId} not found`,
        )
      }

      this.logger.debug(`Resolved advertId from publicationId`, {
        context,
        publicationId,
        advertId: publication.advertId,
      })

      return publication.advertId
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error(`Error resolving advertId from publicationId`, {
        context,
        publicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }
}
