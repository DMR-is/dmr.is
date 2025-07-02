import {
  CommonApplicationUpdateStateEvent,
  SubmitCommonApplicationDto,
} from './dto/common-application.dto'

export interface ICommonApplicationService {
  submitApplication(body: SubmitCommonApplicationDto): Promise<void>

  updateApplicationState(body: CommonApplicationUpdateStateEvent): Promise<void>

  deleteApplication(id: string): Promise<void>
}

export const ICommonApplicationService = Symbol('ICommonApplicationService')
