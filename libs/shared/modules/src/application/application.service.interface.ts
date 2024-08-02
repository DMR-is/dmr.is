import { ApplicationEvent } from '@dmr.is/constants'
import {
  CasePriceResponse,
  GetApplicationResponse,
  GetCaseCommentsResponse,
  PostApplicationComment,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IApplicationService {
  getApplication(id: string): Promise<ResultWrapper<GetApplicationResponse>>

  updateApplication(
    id: string,
    answers?: UpdateApplicationBody,
  ): Promise<ResultWrapper<undefined>>

  submitApplication(
    id: string,
    event: ApplicationEvent,
  ): Promise<ResultWrapper<undefined>>

  postApplication(id: string): Promise<ResultWrapper<undefined>>

  getComments(
    applicationId: string,
  ): Promise<ResultWrapper<GetCaseCommentsResponse>>

  postComment(
    applicationId: string,
    commentBody: PostApplicationComment,
  ): Promise<ResultWrapper>

  getPrice(applicationId: string): Promise<ResultWrapper<CasePriceResponse>>
}

export const IApplicationService = Symbol('IApplicationService')
