import { Inject, Injectable } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { Advert, RegulationDraft } from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

import { IRegulationPublishService } from './regulation-publish.service.interface'

@Injectable()
export class RegulationPublishServiceMock implements IRegulationPublishService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {
    this.logger.info('Using RegulationPublishServiceMock')
  }

  async publishRegulationDirectly(
    draft: RegulationDraft,
    publishedDate: Date,
    advert: Advert,
  ): Promise<ResultWrapper> {
    this.logger.info('Mock: publishRegulationDirectly called', {
      draftId: draft.id,
      publishedDate: publishedDate.toISOString(),
    })
    return ResultWrapper.ok()
  }

  async hasPendingTasks(
    baseRegulationName: string,
  ): Promise<ResultWrapper<boolean>> {
    this.logger.info('Mock: hasPendingTasks called', {
      baseRegulationName,
    })
    return ResultWrapper.ok(false)
  }
}
