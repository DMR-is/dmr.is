import { Inject, Injectable } from '@nestjs/common'
import { ILegalGazetteApplicationService } from './application.service.interface'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { SubmitApplicationDto } from './dto/application.dto'

@Injectable()
export class LegalGazetteApplicationService
  implements ILegalGazetteApplicationService
{
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}
  async submitApplication(body: SubmitApplicationDto): Promise<void> {
    // TODO: database is not implemented yet
  }
}
