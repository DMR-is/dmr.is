import {
  Application,
  CaseComment,
  SubmitApplicationBody,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'

export interface IApplicationService {
  getApplication(id: string): Promise<Application | null>

  updateApplication(
    id: string,
    answers?: UpdateApplicationBody,
  ): Promise<Application | null>

  submitApplication(
    id: string,
    body: SubmitApplicationBody,
  ): Promise<Application | null>

  getComments(applicationId: string): Promise<CaseComment[]>
}

export const IApplicationService = Symbol('IApplicationService')
