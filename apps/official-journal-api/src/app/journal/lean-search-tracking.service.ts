import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { GetAdvertsQueryParams } from '@dmr.is/shared-dto'

import { AdvertSearchEventModel } from './models/advert-search-event.model'
import {
  LeanSearchTrackingEventDto,
  LeanSearchTrackingResultDto,
} from './lean-search-tracking.dto'
import { buildLeanSearchTrackingEvent } from './lean-search-tracking.utils'

const LOGGING_CONTEXT = 'LeanSearchTrackingService'

@Injectable()
export class LeanSearchTrackingService {
  constructor(
    @InjectModel(AdvertSearchEventModel)
    private readonly advertSearchEventModel: typeof AdvertSearchEventModel,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  async track(
    params: GetAdvertsQueryParams | undefined,
    result: LeanSearchTrackingResultDto,
  ): Promise<void> {
    this.logger.debug('Tracking lean search event', {
      context: LOGGING_CONTEXT,
      params: JSON.stringify(params),
    })
    let payload: LeanSearchTrackingEventDto | null = null

    try {
      payload = buildLeanSearchTrackingEvent(params, result)

      this.logger.info('lean_search_tracking', {
        context: LOGGING_CONTEXT,
        ...payload,
        createdAt: new Date().toISOString(),
      })

      await this.advertSearchEventModel.create(payload)
    } catch (error) {
      this.logger.warn('Failed to persist lean search tracking event', {
        context: LOGGING_CONTEXT,
        route: payload?.route,
        queryKind: payload?.queryKind,
        error,
      })
    }
  }
}
