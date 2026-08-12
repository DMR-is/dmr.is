import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { LegalGazetteEvents } from '../../../../core/constants'
import { AdvertModel } from '../../../../models/advert.model'
import {
  ApplicationModel,
  ApplicationStatusEnum,
} from '../../../../models/application.model'
import { TypeIdEnum } from '../../../../models/type.model'
import { AdvertPublishedEvent } from '../events/advert-published.event'

const LOGGING_CONTEXT = 'DivisionEndingPublishedListener'

@Injectable()
export class DivisionEndingPublishedListener {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(ApplicationModel)
    private readonly applicationModel: typeof ApplicationModel,
  ) {}

  /**
   * Nothing follows a Skiptalok, so publishing one closes the estate.
   *
   * This is the only place a recall application is marked FINISHED. Marking it
   * when the advert is *created* meant an estate stayed closed even after an
   * editor rejected the advert, which left the advertiser unable to submit a
   * replacement.
   */
  @OnEvent(LegalGazetteEvents.ADVERT_PUBLISHED, { suppressErrors: false })
  async closeEstate({ advert }: AdvertPublishedEvent) {
    // Matched in SQL rather than against advert.type.id, because Postgres
    // returns UUIDs lower-cased while TypeIdEnum is written upper-case.
    const divisionEnding = await this.advertModel.findOne({
      attributes: ['id', 'applicationId'],
      where: { id: advert.id, typeId: TypeIdEnum.DIVISION_ENDING },
    })

    if (!divisionEnding) {
      return
    }

    if (!divisionEnding.applicationId) {
      this.logger.warn(
        'Published division ending advert has no application, cannot close estate',
        {
          context: LOGGING_CONTEXT,
          advertId: advert.id,
        },
      )
      return
    }

    await this.applicationModel.update(
      { status: ApplicationStatusEnum.FINISHED },
      { where: { id: divisionEnding.applicationId } },
    )

    this.logger.info('Division ending published, estate closed', {
      context: LOGGING_CONTEXT,
      advertId: advert.id,
      applicationId: divisionEnding.applicationId,
    })
  }
}
