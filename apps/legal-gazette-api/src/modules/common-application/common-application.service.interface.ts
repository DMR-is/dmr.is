import { SubmitCommonApplicationDto } from './dto/common-application.dto'

export interface ICommonApplicationService {
  submitApplication(body: SubmitCommonApplicationDto): Promise<void>

  updateApplicationState(id: string, event: 'APPROVE' | 'REJECT'): Promise<void>

  deleteApplication(id: string): Promise<void>
}

export const ICommonApplicationService = Symbol('ICommonApplicationService')
