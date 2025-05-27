import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { SubmitApplicationDto } from './dto/common-application.dto'
import { ICommonApplicationService } from './common-application.service.interface'

@Injectable()
export class CommonApplicationService implements ICommonApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private eventEmitter: EventEmitter2,
  ) {}
  async submitApplication(body: SubmitApplicationDto): Promise<void> {
    // TODO: database is not implemented yet

    this.eventEmitter.emit('common-application.submitted', {})
  }
}
