import { SubmitCommonApplicationDto } from './dto/common-application.dto'

export interface ICommonApplicationService {
  submitApplication(body: SubmitCommonApplicationDto): Promise<void>
}

export const ICommonApplicationService = Symbol('ICommonApplicationService')
