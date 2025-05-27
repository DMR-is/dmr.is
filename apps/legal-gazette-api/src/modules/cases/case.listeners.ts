import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import { CommonApplicationSubmittedEvent } from './events/common-application-submitted.event'

@Injectable()
export class CaseListener {
  @OnEvent('common-application.submitted', { async: true })
  handleCommonApplicationSubmittedEvent(
    event: CommonApplicationSubmittedEvent,
  ) {
    console.log(
      'Common application submitted event received, processing case creation...',
    )
  }
}
