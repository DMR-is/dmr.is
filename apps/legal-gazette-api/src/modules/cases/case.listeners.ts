import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import { LegalGazetteEvents } from '@dmr.is/legal-gazette/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CommonApplicationSubmittedEvent } from './events/common-application-submitted.event'

const LOGGING_CONTEXT = 'CaseEventListener'

@Injectable()
export class CaseEventListener {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  @OnEvent(LegalGazetteEvents.COMMON_APPLICATION_SUBMITTED)
  handleCommonApplicationSubmittedEvent(
    event: CommonApplicationSubmittedEvent,
  ) {
    // todo: do something?
    this.logger.info(`Common application successfully submitted`, {
      context: LOGGING_CONTEXT,
    })
  }
}
