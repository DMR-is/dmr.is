import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { PublicationSearchEventModel } from '../../../models/publication-search-event.model'
import { GetPublicationsQueryDto } from './dto/publication.dto'
import {
  PublicationSearchTrackingEventDto,
  PublicationSearchTrackingResultDto,
} from './dto/publication-search-tracking.dto'
import { buildPublicationSearchTrackingEvent } from './publication-search-tracking.utils'

const LOGGING_CONTEXT = 'PublicationSearchTrackingService'

@Injectable()
export class PublicationSearchTrackingService {
  constructor(
    @InjectModel(PublicationSearchEventModel)
    private readonly publicationSearchEventModel: typeof PublicationSearchEventModel,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  async track(
    query: GetPublicationsQueryDto | undefined,
    result: PublicationSearchTrackingResultDto,
  ): Promise<void> {
    let payload: PublicationSearchTrackingEventDto | null = null

    try {
      payload = buildPublicationSearchTrackingEvent(query, result)

      this.logger.info('publication_search_tracking', {
        context: LOGGING_CONTEXT,
        ...payload,
      })

      await this.publicationSearchEventModel.create(payload)
    } catch (error) {
      this.logger.warn('Failed to persist publication search tracking event', {
        context: LOGGING_CONTEXT,
        route: payload?.route,
        queryKind: payload?.queryKind,
        error,
      })
    }
  }
}
