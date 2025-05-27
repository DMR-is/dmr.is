import { SubmitApplicationDto } from './dto/common-application.dto'

export interface ICommonApplicationService {
  submitApplication(body: SubmitApplicationDto): Promise<void>
}

export const ICommonApplicationService = Symbol('ICommonApplicationService')
