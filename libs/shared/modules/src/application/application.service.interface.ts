import {
  CasePriceResponse,
  GetApplicationResponse,
  GetCaseCommentsResponse,
  PostApplicationComment,
  PostCaseCommentResponse,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IApplicationService {
  getApplication(id: string): Promise<ResultWrapper<GetApplicationResponse>>

  updateApplication(
    id: string,
    answers?: UpdateApplicationBody,
  ): Promise<ResultWrapper<undefined>>

  submitApplication(id: string): Promise<ResultWrapper<undefined>>

  postApplication(id: string): Promise<ResultWrapper<undefined>>

  getComments(
    applicationId: string,
  ): Promise<ResultWrapper<GetCaseCommentsResponse>>

  postComment(
    applicationId: string,
    commentBody: PostApplicationComment,
  ): Promise<ResultWrapper<PostCaseCommentResponse>>

  getPrice(applicationId: string): Promise<ResultWrapper<CasePriceResponse>>
}

export const IApplicationService = Symbol('IApplicationService')
