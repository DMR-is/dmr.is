import { Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { SubmitApplicationDto } from './dto/application.dto'
import { ILegalGazetteApplicationService } from './application.service.interface'

@Injectable()
export class LegalGazetteApplicationService
  implements ILegalGazetteApplicationService
{
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}
  async submitApplication(body: SubmitApplicationDto): Promise<void> {
    // TODO: database is not implemented yet
  }
}
