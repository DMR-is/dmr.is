import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { Inject, Injectable, LoggerService } from '@nestjs/common'

@Injectable()
export class AppService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: LoggerService,
  ) {}

  getData(): { message: string } {
    this.logger.log('Hello API logger')
    return { message: 'Hello API' }
  }
}
