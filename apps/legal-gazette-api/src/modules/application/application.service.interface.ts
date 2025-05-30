import { SubmitApplicationDto } from './dto/application.dto'

export interface ILegalGazetteApplicationService {
  submitApplication(body: SubmitApplicationDto): Promise<void>
}

export const ILegalGazetteApplicationService = Symbol(
  'ILegalGazetteApplicationService',
)
